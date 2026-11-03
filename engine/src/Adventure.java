import com.googlecode.wage_engine.engine.*;
import org.freeshell.gbsmith.rescafe.resourcemanager.ResourceModel;
import com.sun.net.httpserver.*;
import java.awt.Desktop;
import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.*;
import java.util.concurrent.*;
import static java.nio.file.StandardCopyOption.*;

/** Loopback-only adapter. WAGE owns the world; the browser owns the viewpoint. */
public final class Adventure implements Engine.Callbacks {
    private final Path base = Path.of("").toAbsolutePath().normalize();
    private final Path saveDir = Path.of(System.getProperty("user.home"), "Saved Games", "Silicon Adventures");
    private final ByteArrayOutputStream transcript = new ByteArrayOutputStream();
    private final List<String> sounds = new ArrayList<>();
    private final ResourceModel resources = new ResourceModel("Scepters");
    private World world;
    private Engine engine;
    private String menu, session = UUID.randomUUID().toString();
    private String viewData = "";
    private boolean ended, cleared;
    private volatile long lastRequest = System.currentTimeMillis();

    Adventure() throws IOException {
        try (RandomAccessFile input = new RandomAccessFile("archive/es/Scepters.rsrc", "r")) { resources.read(input); }
        begin("altar");
    }
    private void begin(String entry) throws IOException {
        byte[] restore = null;
        String restoredView = "";
        if (entry.equals("restore")) {
            restore = Files.readAllBytes(saveDir.resolve("adventure.sav"));
            if (restore.length >= 8) {
                var trailer = java.nio.ByteBuffer.wrap(restore, restore.length-8, 8);
                int length = trailer.getInt();
                if (trailer.getInt() == 0x53435631 && length >= 0 && length <= 2048 && length <= restore.length-8) {
                    int end = restore.length-8-length;
                    restoredView = new String(restore,end,length,StandardCharsets.UTF_8);
                    restore = Arrays.copyOf(restore,end);
                }
            }
        } else if (entry.startsWith("bookmark/")) {
            Path folder = base.resolve("archive/es/saves");
            Path file = folder.resolve(entry.substring(9)).normalize();
            if (!folder.equals(file.getParent()) || !Files.isRegularFile(file)) throw new IOException("Unknown bookmark");
            restore = Files.readAllBytes(file);
        } else if (!entry.equals("altar") && !entry.equals("new")) throw new IOException("Unknown starting point");
        viewData = restoredView;
        world = new WorldLoader().loadWorld(resources, new File("Scepters"));
        menu = world.getDefaultCommandsMenu();
        ended = false;
        transcript.reset();
        sounds.clear();
        engine = new Engine(world, new PrintStream(transcript, true, StandardCharsets.UTF_8), this) {
            @Override public void playSound(String name) {
                if (name != null && !name.isBlank()) sounds.add(name.trim());
            }
        };
        if (entry.equals("altar")) world.move(world.getPlayer(), world.getSceneByID((short)7990));
        if (restore != null) engine.loadState(new ByteArrayInputStream(restore));
        else engine.processTurn("look", null);
        session = UUID.randomUUID().toString();
    }
    public void setCommandsMenu(String value) { menu = value; }
    public void clearOutput() { cleared = true; }
    public void redrawScene() {}
    public void gameOver() { ended = true; }
    private static String json(Object value) {
        if (value == null) return "null";
        if (value instanceof Number || value instanceof Boolean) return value.toString();
        if (value instanceof Map<?,?> map) {
            StringJoiner s = new StringJoiner(",", "{", "}");
            map.forEach((k,v) -> s.add(json(k.toString()) + ":" + json(v)));
            return s.toString();
        }
        if (value instanceof Collection<?> list) {
            StringJoiner s = new StringJoiner(",", "[", "]");
            list.forEach(v -> s.add(json(v))); return s.toString();
        }
        StringBuilder s = new StringBuilder("\"");
        for (char c : value.toString().toCharArray()) {
            if (c == '"' || c == '\\') s.append('\\').append(c);
            else if (c < 32) s.append(String.format("\\u%04x", (int)c));
            else s.append(c);
        }
        return s.append('"').toString();
    }
    private Object obj(Obj o) { return Map.of("id",(int)o.getResourceID(),"name",o.getName(),"type",o.getType(),"verb",Objects.toString(o.getOperativeVerb(),"")); }
    private String snapshot() {
        Scene scene = world.getPlayerScene();
        Chr p = world.getPlayer();
        Map<String,Object> data = new LinkedHashMap<>();
        data.put("scene", scene.getResourceID());
        data.put("session", session);
        data.put("viewData", viewData);
        data.put("name", scene.getName()); data.put("text", scene.getText());
        data.put("menu", menu); data.put("ended", ended); data.put("clear", cleared);
        data.put("output", transcript.toString(StandardCharsets.UTF_8));
        data.put("sounds", sounds);
        data.put("objects", scene.getState().getObjs().stream().map(this::obj).toList());
        data.put("characters",scene.getState().getChrs().stream().filter(c -> !c.isPlayerCharacter()).map(c -> Map.of("id",(int)c.getResourceID(),"name",c.getName(),"hp",c.getState().getCurrentPhysicalHp())).toList());
        data.put("inventory",p.getState().getInventory().stream().map(this::obj).toList());
        data.put("weapons",Arrays.stream(p.getWeapons(true)).map(w -> w.getOperativeVerb()+" "+w.getName()).toList());
        data.put("hp",p.getState().getCurrentPhysicalHp());
        data.put("maxHp",p.getState().getBasePhysicalHp());
        data.put("saved",Files.isRegularFile(saveDir.resolve("adventure.sav")));
        return json(data);
    }
    private synchronized String action(String path, String arg) throws IOException {
        if (path.equals("state")) return snapshot();
        transcript.reset(); sounds.clear(); cleared = false;
        switch (path) {
            case "start" -> begin(arg);
            case "save" -> {
                if (ended) throw new IOException("This adventure has ended.");
                byte[] bytes = engine.getSaveStateAsByteArray();
                if (bytes == null) throw new IOException("Could not encode save.");
                Files.createDirectories(saveDir);
                Path temp = Files.createTempFile(saveDir, "save-", ".tmp");
                try {
                    try (var stream = new DataOutputStream(Files.newOutputStream(temp))) {
                        stream.write(bytes);
                        byte[] view = arg.getBytes(StandardCharsets.UTF_8);
                        stream.write(view); stream.writeInt(view.length); stream.writeInt(0x53435631);
                    }
                    Files.move(temp, saveDir.resolve("adventure.sav"), REPLACE_EXISTING, ATOMIC_MOVE);
                }
                finally { Files.deleteIfExists(temp); }
            }
            case "turn" -> { if (!ended && !arg.isBlank()) engine.processTurn(arg.trim().toLowerCase(Locale.ROOT), null); }
            case "click" -> {
                if (!ended) {
                    String[] target = arg.split("/");
                    short id = Short.parseShort(target[1]);
                    Object item = target[0].equals("ACHR") ? world.getCharByID(id) : world.getObjByID(id);
                    if (world.getPlayerScene().getState().getObjs().contains(item) || world.getPlayerScene().getState().getChrs().contains(item)) engine.processTurn(null, item);
                }
            }
            case "aim" -> engine.setAim(Math.max(Chr.HEAD,Math.min(Chr.SIDE,Integer.parseInt(arg))));
            default -> throw new IOException("Unknown action.");
        }
        return snapshot();
    }
    private void reply(HttpExchange req, int code, String mime, byte[] data) throws IOException {
        req.getResponseHeaders().set("Content-Type", mime);
        req.getResponseHeaders().set("X-Content-Type-Options","nosniff");
        req.sendResponseHeaders(code, data.length);
        req.getResponseBody().write(data);
    }
    private void serve(HttpExchange req) throws IOException {
        try (req) {
            int port = req.getLocalAddress().getPort();
            String host = "127.0.0.1:"+port;
            if (!host.equals(req.getRequestHeaders().getFirst("Host"))) { req.sendResponseHeaders(403,-1); return; }
            lastRequest = System.currentTimeMillis();
            String route = req.getRequestURI().getPath();
            if (route.startsWith("/api/")) {
                if (!"POST".equals(req.getRequestMethod()) || !"1".equals(req.getRequestHeaders().getFirst("X-Scepters"))) { req.sendResponseHeaders(403,-1); return; }
                req.getResponseHeaders().set("Cache-Control","no-store");
                try {
                    byte[] body = req.getRequestBody().readNBytes(2049);
                    if (body.length > 2048) throw new IOException("Command too long.");
                    String result = action(route.substring(5),new String(body,StandardCharsets.UTF_8));
                    reply(req,200,"application/json; charset=utf-8",result.getBytes(StandardCharsets.UTF_8));
                } catch (Exception e) {
                    e.printStackTrace();
                    reply(req,400,"text/plain; charset=utf-8",Objects.toString(e.getMessage(),"Could not complete that action.").getBytes(StandardCharsets.UTF_8));
                }
                return;
            }
            Path file = base.resolve(route.equals("/") ? "index.html" : route.substring(1)).normalize();
            if (!file.startsWith(base) || !Files.isRegularFile(file)) { req.sendResponseHeaders(404,-1); return; }
            String ext = file.getFileName().toString().replaceFirst("^.*\\.","");
            String mime = Map.of("html","text/html; charset=utf-8","js","text/javascript; charset=utf-8","css","text/css","png","image/png","wav","audio/wav","json","application/json","svg","image/svg+xml","ico","image/x-icon").get(ext);
            if (mime == null) { req.sendResponseHeaders(404,-1); return; }
            reply(req,200,mime,Files.readAllBytes(file));
        }
    }
    public static void main(String[] args) throws Exception {
        Adventure app = new Adventure();
        boolean testing = args.length > 0 && args[0].equals("--test");
        boolean preview = args.length > 0 && args[0].equals("--preview");
        HttpServer http = HttpServer.create(new InetSocketAddress("127.0.0.1",(testing||preview) && args.length > 1 ? Integer.parseInt(args[1]) : 0),0);
        http.createContext("/",app::serve); http.setExecutor(Executors.newFixedThreadPool(4)); http.start();
        String url = "http://127.0.0.1:"+http.getAddress().getPort()+"/";
        System.out.println(url);
        if (!testing && !preview) {
            try { Desktop.getDesktop().browse(URI.create(url)); }
            catch (Exception e) { new ProcessBuilder("rundll32","url.dll,FileProtocolHandler",url).start(); }
        }
        if (!testing) {
            var maintenance = Executors.newSingleThreadScheduledExecutor();
            maintenance.scheduleWithFixedDelay(() -> {
                if (System.currentTimeMillis() - app.lastRequest > 300_000) System.exit(0);
            }, 5, 1, TimeUnit.MINUTES);
        }
    }
}

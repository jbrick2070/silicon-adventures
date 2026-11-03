import com.googlecode.wage_engine.Graphics2DCanvas;
import com.googlecode.wage_engine.engine.Design;
import org.freeshell.gbsmith.rescafe.resourcemanager.ResourceModel;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.TexturePaint;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.RandomAccessFile;
import java.nio.file.Path;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.List;
import java.util.stream.IntStream;
import javax.imageio.ImageIO;

/**
 * Repaint selected High Altar vector records with ExportPlates' original
 * CODE 1 pattern palette. Compile next to archive/es/ExportPlates.java with
 * the same WAGE graphics classpath. No filtering or interpolation is applied.
 */
public class SeparateAltar {
    // Command boundaries in the ASCN 7990 design stream, verified against
    // its encoded rectangles and QuickDraw-style delta polygon coordinates.
    static int word(byte[] a,int n) { return (a[n]&255)*256 + (a[n+1]&255); }

    static int[] boundaries(byte[] design) {
        java.util.ArrayList<Integer> cuts = new java.util.ArrayList<>();
        int cursor = 2, end = word(design,0);
        while (cursor < end) {
            cuts.add(cursor);
            int kind = design[cursor+3];
            switch (kind) {
                case 4: case 12: cursor += 12; break;
                case 8: cursor += 14; break;
                case 16: case 20: cursor += 6 + word(design,cursor+6); break;
                case 24: cursor += 4 + word(design,cursor+4); break;
                default: throw new IllegalArgumentException("Unknown shape "+kind);
            }
        }
        if (cursor != end) throw new IllegalArgumentException("Truncated shape");
        cuts.add(end);
        return cuts.stream().mapToInt(Integer::intValue).toArray();
    }

    static void render(Path dest, byte[] source, TexturePaint[] tiles,
                       boolean opaque, int... commands) throws Exception {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        out.write(0);
        out.write(0);
        int[] cuts = boundaries(source);
        for (int n : commands) {
            out.write(source, cuts[n-1], cuts[n] - cuts[n-1]);
        }
        byte[] design = out.toByteArray();
        design[0] = (byte)(design.length >>> 8);
        design[1] = (byte)design.length;
        BufferedImage image = new BufferedImage(338,314,BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = image.createGraphics();
        if (opaque) {
            g.setColor(Color.WHITE);
            g.fillRect(0,0,338,314);
        }
        new Design(design).paint(new Graphics2DCanvas(g),tiles,false);
        g.dispose();
        ImageIO.write(image,"png",dest.toFile());
    }

    static int[] expand(String ranges) {
        return java.util.Arrays.stream(ranges.split(",")).flatMapToInt(range -> {
            String[] ends = range.split("-");
            return IntStream.rangeClosed(Integer.parseInt(ends[0]),Integer.parseInt(ends[ends.length-1]));
        }).toArray();
    }

    static void foregrounds(ResourceModel model,TexturePaint[] tiles,Path out) throws Exception {
        Map<Integer,List<String[]>> rooms = new LinkedHashMap<>();
        for(String line : Files.readAllLines(out.resolve("foreground.tsv"))) {
            if(line.isBlank()||line.startsWith("#"))continue;
            String[] fields = line.split("\\|");
            rooms.computeIfAbsent(Integer.parseInt(fields[0]),key->new ArrayList<>()).add(fields);
        }
        Path layers=Files.createDirectories(out.resolve("foreground"));
        List<String> index=new ArrayList<>();
        for(var entry:rooms.entrySet()){
            int id=entry.getKey();
            byte[] stream=model.getResource("ASCN",(short)id).getData();
            boolean[] used=new boolean[boundaries(stream).length];
            for(String[] fields:entry.getValue()){
                int[] selected=expand(fields[3]);
                for(int n:selected)used[n]=true;
                String name=id+"-"+fields[1]+".png";
                Path dest=layers.resolve(name);
                render(dest,stream,tiles,false,selected);
                BufferedImage sprite=ImageIO.read(dest.toFile());
                int left=sprite.getWidth(),top=sprite.getHeight(),right=0,bottom=0;
                for(int y=0;y<sprite.getHeight();y++) for(int x=0;x<sprite.getWidth();x++){
                    if((sprite.getRGB(x,y)>>>24)==0)continue;
                    left=Math.min(left,x);right=Math.max(right,x+1);
                    top=Math.min(top,y);bottom=Math.max(bottom,y+1);
                }
                index.add("["+id+",\""+fields[1]+"\",\""+fields[2]+"\",\""+fields[4]+"\","+
                    fields[5]+","+fields[6]+","+left+","+top+","+right+","+bottom+"]");
            }
            render(layers.resolve(id+"-clean.png"),stream,tiles,true,
                IntStream.range(1,used.length).filter(n->!used[n]).toArray());
        }
        List<String> palette=new ArrayList<>();
        byte[] code=model.getResource("CODE",(short)1).getData();
        for(int i=0;i<29;i++){
            List<String> rows=new ArrayList<>();
            for(int y=0;y<8;y++)rows.add(String.valueOf(code[0x55ac+i*8+y]&255));
            palette.add("["+String.join(",",rows)+"]");
        }
        Files.writeString(out.resolve("foreground-index.js"),
            "/* Derived from foreground.tsv and the native ASCN alpha bounds. */\nwindow.ForegroundForms=[\n"+
            String.join(",\n",index)+"\n];\n"+
            "/* Original Enchanted Scepters CODE 1 dither tiles, one-based design indices. */\n"+
            "window.ScepterPatterns=[null,"+String.join(",",palette)+"];\n");
    }

    public static void main(String[] args) throws Exception {
        ResourceModel model = new ResourceModel("Scepters");
        try (RandomAccessFile file = new RandomAccessFile(args[0],"r")) {
            model.read(file);
        }
        Path out = Path.of(args[1]);
        byte[] design = model.getResource("ASCN",(short)7990).getData();
        TexturePaint[] tiles = ExportPlates.patterns(model.getResource("CODE",(short)1).getData());
        render(out.resolve("altar-clean.png"),design,tiles,true,
                1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,21,22,24);
        render(out.resolve("altar-dais.png"),design,tiles,false,16,23);
        render(out.resolve("altar-column-left.png"),design,tiles,false,19,20);
        render(out.resolve("altar-column-right.png"),design,tiles,false,17,18);
        render(out.resolve("altar-plinth.png"),design,tiles,false,25,26,27);
        design = model.getResource("ASCN",(short)21149).getData();
        render(out.resolve("quarters-clean.png"),design,tiles,true,1,2,3,4,5,10,11);
        render(out.resolve("quarters-bed.png"),design,tiles,false,6,7,8,9,12);
        design = model.getResource("ASCN",(short)29408).getData();
        render(out.resolve("sanctum-clean.png"),design,tiles,true,
            1,2,3,4,5,16,18,19,20,21,22,23,24,25,26,31);
        render(out.resolve("sanctum-table.png"),design,tiles,false,6,7,8,9,10,17);
        render(out.resolve("sanctum-book.png"),design,tiles,false,11,12,13,14,15);
        render(out.resolve("sanctum-arch.png"),design,tiles,false,27,28,29,30);
        design = model.getResource("ASCN",(short)10021).getData();
        render(out.resolve("court-clean.png"),design,tiles,true,
            1,2,3,4,5,6,7,8,9,10,11,12,14,15,16,17,18,19,20,21,22,23,24,25,29,30,31,32,33,34,35);
        render(out.resolve("court-basin.png"),design,tiles,false,13,26,27,28);
        foregrounds(model,tiles,out);
    }
}

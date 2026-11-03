import com.googlecode.wage_engine.Graphics2DCanvas;
import com.googlecode.wage_engine.engine.Design;
import org.freeshell.gbsmith.rescafe.resourcemanager.*;
import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.*;
import java.nio.ByteBuffer;
import java.nio.file.*;

/** Render the resource's drawing commands at their native coordinates with its own tile palette. */
public class ExportPlates {
    static TexturePaint[] patterns(byte[] code) {
        TexturePaint[] tiles = new TexturePaint[29];
        for (int n = 0; n < tiles.length; n++) {
            BufferedImage tile = new BufferedImage(8, 8, BufferedImage.TYPE_BYTE_BINARY);
            for (int y = 0; y < 8; y++)
                for (int x = 0; x < 8; x++)
                    tile.setRGB(x, y, (code[0x55ac + 8*n + y] & (128 >> x)) != 0 ? 0xff000000 : 0xffffffff);
            tiles[n] = new TexturePaint(tile, new Rectangle(0, 0, 8, 8));
        }
        return tiles;
    }

    public static void main(String[] args) throws Exception {
        Path output = Files.createDirectories(Paths.get(args[1]));
        ResourceModel model = new ResourceModel("Scepters");
        try (RandomAccessFile fork = new RandomAccessFile(args[0], "r")) { model.read(fork); }
        TexturePaint[] tiles = patterns(model.getResource("CODE", (short)1).getData());
        StringBuilder geometry = new StringBuilder();
        for (String type : new String[] {"ASCN", "AOBJ", "ACHR"}) {
            for (Resource resource : model.getResourceType(type).getResArray()) {
                byte[] data = resource.getData();
                Design design = new Design(data);
                // The scene's design window clips any linework beyond its content rectangle.
                ByteBuffer buf = ByteBuffer.wrap(data);
                buf.position(buf.getShort());
                int top = buf.getShort(), left = buf.getShort();
                int height = buf.getShort() - top, width = buf.getShort() - left;
                Rectangle box = new Rectangle(0, 0, width, height);
                if (!type.equals("ASCN")) {
                    // The object editor's window can be smaller than its original art.
                    box = design.getBounds();
                    box.grow(12, 12);
                }
                BufferedImage image = new BufferedImage(box.width, box.height, BufferedImage.TYPE_INT_ARGB);
                Graphics2D g = image.createGraphics();
                g.translate(-box.x, -box.y);
                if (type.equals("ASCN")) {
                    g.setColor(Color.WHITE);
                    g.fillRect(0, 0, width, height);
                }
                design.paint(new Graphics2DCanvas(g), tiles, false);
                g.dispose();
                if (!type.equals("ASCN")) {
                    int minX = image.getWidth(), minY = image.getHeight(), maxX = -1, maxY = -1;
                    for (int y = 0; y < image.getHeight(); y++)
                        for (int x = 0; x < image.getWidth(); x++)
                            if ((image.getRGB(x, y) >>> 24) != 0) {
                                minX = Math.min(minX, x); minY = Math.min(minY, y);
                                maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
                            }
                    if (maxX == -1) {
                        box = new Rectangle(0, 0, 1, 1);
                        image = new BufferedImage(1, 1, BufferedImage.TYPE_INT_ARGB);
                    } else {
                        int cropWidth = maxX - minX + 1, cropHeight = maxY - minY + 1;
                        image = image.getSubimage(minX, minY, cropWidth, cropHeight);
                        box = new Rectangle(box.x + minX, box.y + minY, cropWidth, cropHeight);
                    }
                }
                ImageIO.write(image, "PNG", output.resolve(type + "-" + resource.getID() + ".png").toFile());
                geometry.append(type + "\t" + resource.getID() + "\t" + box.x + "\t" + box.y
                    + "\t" + box.width + "\t" + box.height + "\n");
            }
        }
        Files.writeString(output.resolveSibling("bounds.tsv"), geometry);
    }
}

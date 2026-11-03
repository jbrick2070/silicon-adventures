using System;
using System.Diagnostics;
using System.IO;
using System.Windows.Forms;

internal static class Launch {
    [STAThread]
    private static void Main() {
        string root = AppDomain.CurrentDomain.BaseDirectory;
        string java = Path.Combine(root, "engine", "runtime", "bin", "javaw.exe");
        try {
            if (!File.Exists(java) || !File.Exists(Path.Combine(root, "engine", "adventure.jar")))
                throw new IOException("Extract the complete game folder first. Keep the launcher beside the engine and game folders.");
            Process.Start(new ProcessStartInfo {
                FileName = java, Arguments = "-jar engine/adventure.jar", WorkingDirectory = root,
                UseShellExecute = false, CreateNoWindow = true
            });
        } catch (Exception error) {
            MessageBox.Show(error.Message, "Enchanted Scepters", MessageBoxButtons.OK, MessageBoxIcon.Information);
        }
    }
}

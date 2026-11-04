/* Web edition only. Run the shipped WAGE interpreter in this tab. */
(() => {
  'use strict';
  let jvm, engine, queue = Promise.resolve();

  async function bytes(path) {
    const response = await fetch(path);
    if (!response.ok) throw new Error('Could not load ' + path + ' (' + response.status + ').');
    return new Uint8Array(await response.arrayBuffer());
  }

  async function loadJvm() {
    if (!window.cheerpjInit) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cjrtnc.leaningtech.com/5.0/loader.js';
        script.onload = resolve;
        script.onerror = () => {
          script.remove();
          reject(new Error('Could not load the browser runtime. Check your connection and try again.'));
        };
        document.head.append(script);
      });
    }
    // /files is CheerpJ's browser-local IndexedDB filesystem.
    await cheerpjInit({version: 17, status: 'none', javaProperties: [
      'user.dir=/files', 'user.home=/files/silicon-adventures'
    ]});
  }

  async function boot() {
    if (!jvm) jvm = loadJvm().catch(error => { jvm = null; throw error; });
    await jvm;
    // The memory mount also works on static hosts without byte-range support.
    cheerpOSAddStringFile('/str/adventure.jar', await bytes('engine/adventure.jar'));
    const lib = await cheerpjRunLibrary('/str/adventure.jar');
    const File = await lib.java.io.File, Files = await lib.java.nio.file.Files;
    const Copy = await lib.java.nio.file.StandardCopyOption;
    // Adventure opens the resource fork relative to its working directory.
    // Install complete files atomically so two tabs can start together.
    async function stage(path) {
      const data = await bytes(path);
      const file = await new File('/files/' + path);
      const parent = await file.getParentFile();
      await parent.mkdirs();
      const temp = await Files.createTempFile(await parent.toPath(), 'stage-', '.tmp', []);
      try {
        await Files.write(temp, new Int8Array(data.buffer), []);
        await Files.move(temp, await file.toPath(), [await Copy.ATOMIC_MOVE, await Copy.REPLACE_EXISTING]);
      } finally {
        await Files.deleteIfExists(temp);
      }
    }
    await stage('archive/es/Scepters.rsrc');

    // Call the desktop adapter's command dispatcher directly, bypassing its HTTP listener.
    const ClassLoader = await lib.java.lang.ClassLoader;
    const loader = await ClassLoader.getSystemClassLoader();
    const adventure = await loader.loadClass('Adventure');
    const ctor = (await adventure.getDeclaredConstructors())[0];
    await ctor.setAccessible(true);
    const app = await ctor.newInstance([]);
    const string = await loader.loadClass('java.lang.String');
    const dispatch = await adventure.getDeclaredMethod('action', [string, string]);
    await dispatch.setAccessible(true);
    return async (action, arg) => {
      if (action === 'start' && arg.startsWith('bookmark/')) {
        const name = arg.slice('bookmark/'.length);
        if (!/^[a-z][a-z ']*$/i.test(name)) throw new Error('Unknown bookmark.');
        await stage('archive/es/saves/' + name);
      }
      return JSON.parse(await dispatch.invoke(app, [action, arg]));
    };
  }

  window.BrowserEngine = {
    action(action, arg = '') {
      const pending = queue.then(async () => {
        if (!engine) engine = boot().catch(error => { engine = null; throw error; });
        try {
          const dispatch = await engine;
          return await dispatch(action, arg);
        } catch (error) {
          if (error instanceof Error) throw error;
          // Java exceptions are proxy objects, not JavaScript Errors.
          let message;
          try { message = await ((await error.getCause()) || error).getMessage(); } catch {}
          throw new Error(message || 'The browser engine could not complete that action.');
        }
      });
      queue = pending.catch(() => {});
      return pending;
    }
  };
})();

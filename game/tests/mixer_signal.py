"""Measure the running Web Audio graph without sending any samples to the speakers."""

from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait


def install_meter(driver):
    # Install before the first audio context starts. The analyser sees the final
    # mix; the output device receives zero even while testing the Sound-on UI.
    driver.execute_script("""
        const connect = AudioNode.prototype.connect;
        AudioNode.prototype.connect = function(dest, ...args) {
            if (!(dest instanceof AudioDestinationNode)) return connect.call(this, dest, ...args);
            const analyser = this.context.createAnalyser(), silence = this.context.createGain();
            silence.gain.value = 0;
            connect.call(this, analyser);
            connect.call(analyser, silence);
            connect.call(silence, dest);
            window.mixerMeter = analyser;
            return dest;
        };
        const setVolume = SceneSound.prototype.setVolume;
        SceneSound.prototype.setVolume = function(...args) {
            window.mixerScene = this;
            return setVolume.apply(this, args);
        };
    """)


def check_mixer(driver):
    wait = WebDriverWait(driver, 60)

    def element(name):
        return driver.find_element(By.ID, name)

    def drag(channel, high):
        slider = element(channel + "Volume")
        half = int(slider.size["width"] / 2) - 1
        ActionChains(driver).move_to_element(slider).click_and_hold().move_by_offset(
            half if high else -half, 0
        ).release().perform()
        assert int(slider.get_property("value")) == (100 if high else 0)

    def rms():
        return driver.execute_async_script("""
            const done = arguments[0], analyser = window.mixerMeter;
            const samples = new Float32Array(analyser.fftSize);
            let energy = 0, reads = 0;
            function read() {
                analyser.getFloatTimeDomainData(samples);
                for (const value of samples) energy += value * value;
                if (++reads === 16) done(Math.sqrt(energy / (reads * samples.length)));
                else setTimeout(read, 32);
            }
            setTimeout(read, 350);
        """)

    assert driver.execute_script("return !!(window.mixerMeter && window.mixerScene)")
    original = {c: element(c + "Volume").get_property("value") for c in ("music", "effects")}
    drag("effects", False)
    element("musicBtn").click()
    element("soundBtn").click()
    try:
        wait.until(lambda _: "Quest" in element("nowPlaying").text)
        normal = wait.until(lambda _: (level if (level := rms()) > 0.0001 else False))
        drag("music", False)
        silent = rms()
        drag("music", True)
        loud = rms()
        print("Soundtrack output RMS, initial / zero / full:", normal, silent, loud, flush=True)
        assert silent < 1e-6 and loud > 0.0001
        assert "Quest" in element("nowPlaying").text

        drag("music", False)
        # Repeat a real disk recording through the game's effects path. A room
        # with no current effect would otherwise read zero at every setting.
        driver.execute_script("""
            const s = window.mixerScene, ctx = s.vault.ctx;
            window.mixerEffect = s.emitDry(s.vault.buffers['dc:0'], ctx.currentTime, 0.30);
            mixerEffect.loop = true;
        """)
        silent = rms()
        drag("effects", True)
        loud = rms()
        drag("effects", False)
        silent_again = rms()
        print("Disk effect output RMS, zero / full / zero:", silent, loud, silent_again, flush=True)
        assert max(silent, silent_again) < 1e-6 and loud > 0.0001
    finally:
        element("soundBtn").click()
        driver.execute_script("window.mixerEffect?.stop()")
        element("musicBtn").click()
        for channel, value in original.items():
            driver.execute_script("""
                const [slider, v] = arguments;
                slider.value = v; slider.dispatchEvent(new Event('input', {bubbles: true}));
            """, element(channel + "Volume"), value)

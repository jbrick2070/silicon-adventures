"""Smoke-test the hosted browser edition in a fresh Mac browser automation session."""

import sys

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from mixer_signal import check_mixer, install_meter


def smoke(driver, url):
    wait = WebDriverWait(driver, 150)

    def element(element_id):
        return driver.find_element(By.ID, element_id)

    def open_muted(*, fresh=False):
        driver.get(url)
        driver.execute_script("""
            window.smokeErrors = [];
            window.addEventListener('error', e => smokeErrors.push(e.message));
            window.addEventListener('unhandledrejection', e => smokeErrors.push(String(e.reason)));
        """)
        wait.until(lambda _: element("soundBtn").is_displayed())
        if fresh:
            assert element("soundBtn").get_attribute("aria-pressed") == "true"
            assert element("musicBtn").get_attribute("aria-pressed") == "true"
            element("soundBtn").click()
        assert element("soundBtn").get_attribute("aria-pressed") == "false"
        wait.until(lambda _: element("journey").is_enabled() and "Ready" in element("browserStatus").text)

    def volumes(effects, music):
        for channel, number in [("effects", effects), ("music", music)]:
            slider = element(channel + "Volume")
            assert slider.is_displayed() and element(channel + "Percent").is_displayed()
            assert int(slider.get_property("value")) == number
            assert element(channel + "Percent").text == f"{number}%"

    def room(name):
        wait.until(lambda _: element("roomTitle").text.lower() == name)

    def check_page():
        errors = driver.execute_script("return window.smokeErrors")
        assert not errors, errors
        assert not element("dialog").is_displayed(), element("dialogBody").text

    open_muted(fresh=True)
    install_meter(driver)
    volumes(60, 60)
    element("effectsVolume").send_keys(Keys.ARROW_LEFT)
    volumes(59, 60)
    element("musicVolume").send_keys(Keys.ARROW_RIGHT)
    volumes(59, 61)
    element("musicBtn").click()
    assert element("musicBtn").get_attribute("aria-pressed") == "false"
    element("journey").click()
    room("quarters")
    check_mixer(driver)
    assert driver.execute_script("const c = document.querySelector('#world'); return [c.width, c.height]") == [338, 314]
    element("layerBtn").click()
    assert element("pictureMode").get_attribute("value") == "original"
    classic_picture = element("world").screenshot_as_png
    element("layerBtn").click()
    assert element("pictureMode").get_attribute("value") == "colour"
    wait.until(lambda _: element("world").screenshot_as_png != classic_picture)

    # A save made away from the starting room distinguishes restore from a fresh
    # game. Disable checkpoints so the return trip cannot replace that save.
    element("guideBtn").click()
    driver.find_element(By.XPATH, "//button[.='Turn doorway checkpoints off']").click()
    element("closeDialog").click()
    element("cmd").send_keys("south", Keys.ENTER)
    room("marble hall")
    element("save").click()
    wait.until(lambda _: "Adventure saved." in element("log").text)
    element("cmd").send_keys("north", Keys.ENTER)
    room("quarters")
    check_page()

    # Drop only this tab's live-session token. The second load must read the
    # persistent browser save to get back to the marble hall.
    driver.execute_script("sessionStorage.clear()")
    open_muted()
    volumes(59, 61)
    assert element("musicBtn").get_attribute("aria-pressed") == "false"
    wait.until(lambda _: element("resume").is_displayed())
    element("resume").click()
    room("marble hall")
    wait.until(lambda _: "Restored" in element("log").text)
    check_page()


def diagnose(driver):
    """Report whether cover rendering or engine startup failed."""
    driver.set_script_timeout(45)
    print("Startup status:", driver.execute_script("""
        return {
            status: document.querySelector('#browserStatus')?.textContent,
            dialog: document.querySelector('#dialogBody')?.innerText,
            runtime: typeof window.cheerpjInit,
            runtimeRequests: performance.getEntriesByType('resource')
                .filter(r => /leaningtech|Scepters.rsrc|adventure.jar/.test(r.name)).slice(-8)
                .map(r => [r.name, r.responseStatus, Math.round(r.duration)])
        };
    """), flush=True)
    checks = {
        "cover": """
            const view = new PlateView(document.createElement('canvas'));
            const room = ES_DESIGNS.find(r => r.type === 'ASCN' && r.id === 7990);
            await view.load(room);
            const lid = ES_DESIGNS.find(r => r.type === 'AOBJ' && r.id === 14168);
            await view.add(lid, 'AOBJ/14168', {x:0,z:4.18,y:1.8,w:0.3,h:0.3});
            view.render(0);
            return 'rendered';
        """,
        "engine": "const snapshot = await BrowserEngine.action('state'); return snapshot.name;",
    }
    for label, js in checks.items():
        try:
            out = driver.execute_async_script(
                "const done = arguments[0]; (async () => {" + js +
                "})().then(done, e => done([e.name, e.message, String(e.stack)]));"
            )
            print(label, out, flush=True)
        except Exception as error:
            print(label, str(error), flush=True)


if __name__ == "__main__":
    if sys.argv[2:] == ["chrome"]:
        options = webdriver.ChromeOptions()
        options.add_argument("--headless=new")
        options.add_argument("--mute-audio")
        browser = webdriver.Chrome(options=options)
    else:
        browser = webdriver.Safari()
    with browser as driver:
        print(driver.capabilities["browserName"], driver.capabilities["browserVersion"], flush=True)
        try:
            smoke(driver, sys.argv[1])
        except Exception:
            print("Current page:", driver.current_url)
            diagnose(driver)
            raise
        print("Audio controls, new journey, travel, rendered picture modes, save and restore passed.")

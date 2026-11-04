"""Smoke-test the hosted browser edition in a fresh Mac browser automation session."""

import sys

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support import expected_conditions as EC
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

    # Reach the optional passage by the original room exits. Exercise both the
    # wrong answer and the visual-only solution, including an in-passage save.
    for direction, name in [("east", "banquet hall"), ("south", "armory")]:
        element("cmd").send_keys(direction, Keys.ENTER)
        room(name)

    def click_button(text):
        root = "//dialog[@id='knockQuest']" if driver.find_elements(By.ID, "knockQuest") else ""
        button = wait.until(EC.element_to_be_clickable((By.XPATH, root + f"//button[normalize-space(.)='{text}']")))
        button.click()

    def campaign_snapshot():
        return driver.execute_async_script("""
            const done = arguments[0];
            BrowserEngine.action('state').then(s => done({
                scene:s.scene, hp:s.hp, objects:s.objects, characters:s.characters,
                inventory:s.inventory, weapons:s.weapons
            }));
        """)

    before_excursion = campaign_snapshot()
    click_button("Answer the knock")
    click_button("Knock back")
    click_button("Wing")
    click_button("Strike the selected shield")
    assert "stays fast" in driver.find_element(By.CSS_SELECTOR, ".knock-feedback").text
    click_button("Save here")
    wait.until(lambda _: "Saved here" in driver.find_element(By.CSS_SELECTOR, ".knock-feedback").text)
    open_muted()
    element("resume").click()
    click_button("Crescent")
    click_button("Strike the selected shield")
    click_button("Climb to the watchtower")
    assert element("knockTitle").text == "The watchtower"
    assert [element("knockCanvas").get_property(k) for k in ("width", "height")] == [338, 314]

    click_button("Use the signal lamp")
    click_button("Read the signal card")
    click_button("Face west")
    for flash in ("Short flash", "Long flash", "Short flash"):
        click_button(flash)
    click_button("Send signal")
    wait.until(lambda _: "pilot circles" in driver.find_element(By.CSS_SELECTOR, ".knock-feedback").text)
    assert "beacon" in element("knockTitle").text.lower()

    click_button("Face east")
    click_button("Clear signal")
    for _ in range(3):
        click_button("Short flash")
    click_button("Send signal")
    wait.until(lambda _: "cockpit flashes" in driver.find_element(By.CSS_SELECTOR, ".knock-feedback").text)
    assert "beacon" in element("knockTitle").text.lower()

    # The normal keyboard path can build a signal and save it unfinished.
    click_button("Clear signal")
    driver.find_element(By.XPATH, "//button[normalize-space(.)='Short flash']").send_keys(Keys.ENTER)
    driver.find_element(By.XPATH, "//button[normalize-space(.)='Long flash']").send_keys(Keys.SPACE)
    signal = driver.find_element(By.CSS_SELECTOR, ".knock-signal").text
    click_button("Save here")
    wait.until(lambda _: "Saved here" in driver.find_element(By.CSS_SELECTOR, ".knock-feedback").text)
    open_muted()
    element("resume").click()
    wait.until(lambda _: "beacon" in element("knockTitle").text.lower())
    assert driver.find_element(By.CSS_SELECTOR, ".knock-signal").text == signal
    assert driver.find_element(By.XPATH, "//button[normalize-space(.)='Face east']").get_attribute("aria-pressed") == "true"

    click_button("Short flash")
    click_button("Send signal")
    wait.until(lambda _: element("knockTitle").text == "The courier’s reply")
    click_button("Open the message tube")
    assert "Eastern field is clear" in driver.find_element(By.CSS_SELECTOR, ".knock-feedback").text

    click_button("Classic B/W")
    colours = driver.execute_script("""
        const src = document.querySelector('#knockCanvas'), c = document.createElement('canvas');
        c.width = src.width; c.height = src.height;
        const ctx = c.getContext('2d', {willReadFrequently: true});
        ctx.drawImage(src, 0, 0);
        const data = ctx.getImageData(0, 0, c.width, c.height).data, values = new Set();
        for (let i = 0; i < data.length; i += 4) values.add([data[i],data[i+1],data[i+2],data[i+3]].join(','));
        return Array.from(values).sort();
    """)
    assert colours == ["0,0,0,255", "255,255,255,255"], colours
    click_button("Lit colour")
    click_button("Return to the watchtower")
    click_button("Read the courier’s message")
    assert "Eastern field is clear" in driver.find_element(By.CSS_SELECTOR, ".knock-feedback").text
    click_button("Save here")
    wait.until(lambda _: "Saved here" in driver.find_element(By.CSS_SELECTOR, ".knock-feedback").text)
    open_muted()
    element("resume").click()
    wait.until(lambda _: element("knockTitle").text == "The courier’s reply")
    assert "Eastern field is clear" in driver.find_element(By.CSS_SELECTOR, ".knock-feedback").text
    click_button("Return to the armory")
    room("armory")
    assert campaign_snapshot() == before_excursion
    assert "brass wing" in element("log").text

    # An actual previous-release save has only stage and solved in its quest
    # trailer. Recreate that trailer around this private campaign save.
    legacy_save = driver.execute_async_script("""
        const done = arguments[0];
        (async () => {
            const s = await BrowserEngine.action('state');
            const view = JSON.parse(s.viewData);
            view.knock = {stage:'tower',solved:true,open:true};
            await BrowserEngine.action('save', JSON.stringify(view));
        })().then(() => done(null), error => done(String(error)));
    """)
    assert legacy_save is None, legacy_save
    open_muted()
    element("resume").click()
    wait.until(lambda _: element("knockTitle").text == "The watchtower")
    click_button("Use the signal lamp")
    assert driver.find_element(By.CSS_SELECTOR, ".knock-signal").text == "Facing north · No flashes entered"
    click_button("Return to the armory")
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

"""Smoke-test the hosted browser edition in an isolated macOS Safari automation session."""

import sys

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait


def smoke(driver, url):
    wait = WebDriverWait(driver, 150)

    def element(element_id):
        return driver.find_element(By.ID, element_id)

    def open_muted():
        driver.get(url)
        driver.execute_script("""
            window.smokeErrors = [];
            window.addEventListener('error', e => smokeErrors.push(e.message));
            window.addEventListener('unhandledrejection', e => smokeErrors.push(String(e.reason)));
        """)
        wait.until(lambda _: element("soundBtn").is_displayed())
        if element("soundBtn").get_attribute("aria-pressed") == "true":
            element("soundBtn").click()
        assert element("soundBtn").get_attribute("aria-pressed") == "false"
        wait.until(lambda _: element("journey").is_enabled() and "Ready" in element("browserStatus").text)

    def room(name):
        wait.until(lambda _: element("roomTitle").text.lower() == name)

    def check_page():
        errors = driver.execute_script("return window.smokeErrors")
        assert not errors, errors
        assert not element("dialog").is_displayed(), element("dialogBody").text

    open_muted()
    element("journey").click()
    room("quarters")
    assert driver.execute_script("const c = document.querySelector('#world'); return [c.width, c.height]") == [338, 314]
    element("layerBtn").click()
    assert element("pictureMode").get_attribute("value") == "original"
    element("layerBtn").click()
    assert element("pictureMode").get_attribute("value") == "colour"

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
    wait.until(lambda _: element("resume").is_displayed())
    element("resume").click()
    room("marble hall")
    wait.until(lambda _: "Restored" in element("log").text)
    check_page()


if __name__ == "__main__":
    with webdriver.Safari() as safari:
        print("Safari", safari.capabilities.get("browserVersion"), flush=True)
        try:
            smoke(safari, sys.argv[1])
        except Exception:
            print("Current page:", safari.current_url)
            print(safari.find_element(By.TAG_NAME, "body").text[-5000:])
            raise
        print("New journey, travel, picture modes, save and restore passed.")

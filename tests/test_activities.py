import copy

from fastapi.testclient import TestClient

from src import app as app_module


client = TestClient(app_module.app)
_ORIGINAL = copy.deepcopy(app_module.activities)


def setup_function(function):
    # restore the in-memory activities before each test
    app_module.activities = copy.deepcopy(_ORIGINAL)


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    # check a known activity exists
    assert "Chess Club" in data


def test_signup_and_unregister_flow():
    activity = "Basketball Team"
    email = "tester@example.com"

    # ensure clean start
    assert email not in app_module.activities[activity]["participants"]

    # sign up
    r = client.post(f"/activities/{activity}/signup?email={email}")
    assert r.status_code == 200
    assert email in app_module.activities[activity]["participants"]
    assert "Signed up" in r.json()["message"]

    # duplicate signup should fail
    r2 = client.post(f"/activities/{activity}/signup?email={email}")
    assert r2.status_code == 400

    # unregister
    r3 = client.delete(f"/activities/{activity}/participants?email={email}")
    assert r3.status_code == 200
    assert email not in app_module.activities[activity]["participants"]
    assert "Unregistered" in r3.json()["message"]


def test_unregister_nonexistent():
    activity = "Basketball Team"
    email = "noone@example.com"

    # ensure not present
    if email in app_module.activities[activity]["participants"]:
        app_module.activities[activity]["participants"].remove(email)

    r = client.delete(f"/activities/{activity}/participants?email={email}")
    assert r.status_code == 404

import json

import pytest

from chakra_backend.registry import load, parse


def test_writable_contents_carry_write_metadata():
    r = load()
    for c in r.contents.values():
        if c.writable:
            assert c.id_prefix and c.required and c.key == ["id"]
    assert [x for x in r.contents["employees"].relations] == [("department_id", "departments"), ("designation_id", "designations")]
    assert r.contents["employee_teams"].key == ["id"] and "password_hash" in r.contents["employees"].hidden


def _one(**kw):
    return {"contents": [{"id": "a", "tab": "A", "key": ["id"], "columns": ["id", "name"], **kw}]}


@pytest.mark.parametrize("kw", [{"required": ["nope"]}, {"relations": [{"column": "name", "content": "zzz"}]},
                                {"writable": True, "key": ["name"]}, {"integers": ["nope"]}])
def test_bad_registry_is_rejected_at_load(kw):
    with pytest.raises(ValueError):
        parse(_one(**kw))

from backend.search import federated_search

def test_returns_something():
    res = federated_search("machine learning", k=2)
    assert len(res) >= 2

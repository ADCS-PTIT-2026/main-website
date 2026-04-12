import httpx

class HttpClient:
    client: httpx.AsyncClient = None

http_client = HttpClient()
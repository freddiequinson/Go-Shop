import requests
import json

# Test delivery price calculation
url = "http://localhost:8000/api/v1/delivery-settings/calculate-price"
payload = {
    "destination_latitude": 5.6,
    "destination_longitude": -0.1
}

response = requests.post(url, json=payload)
print("Status Code:", response.status_code)
print("\nResponse:")
print(json.dumps(response.json(), indent=2))

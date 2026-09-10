import urllib.request
import re

url = 'https://flowshield-git-main-vishwananth17s-projects.vercel.app/'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req) as response:
        content = response.read().decode('utf-8')
        print(f"Status: {response.status}")
        print("HTML length:", len(content))
        # Find script tags
        scripts = re.findall(r'<script[^>]*src="([^"]+)"', content)
        print("Scripts found:", scripts)
        for s in scripts:
            if s.startswith('/'):
                s_url = 'https://flowshield-git-main-vishwananth17s-projects.vercel.app' + s
            else:
                s_url = s
            try:
                with urllib.request.urlopen(s_url) as s_resp:
                    js = s_resp.read().decode('utf-8')
                    print(f"Script {s} length: {len(js)}")
                    if "Automated Dispute" in js:
                        print(f"Found 'Automated Dispute' in {s}")
                    if "See the risk" in js:
                        print(f"Found 'See the risk' in {s}")
                    if "Cybercrime 1930" in js:
                        print(f"Found 'Cybercrime 1930' in {s}")
            except Exception as e:
                print(f"Error fetching script {s}: {e}")
except Exception as e:
    print(f"Error: {e}")

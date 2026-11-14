import re, json, sys, csv, hashlib, concurrent.futures as cf, urllib.request
import os
BASE=os.environ.get("BASE","https://www.bijbelquiz.com").rstrip("/")
# Usage: BASE=https://<preview>.vercel.app python3 scripts/seo/crawl.py out/prefix
# Crawls every URL from the sitemaps and records the SEO fields per page.
UA={"User-Agent":"BijbelQuiz-SEO-baseline/1.0"}
import time
def get(url):
    for i in range(5):
        try: return _get(url)
        except Exception as e:
            err=e; time.sleep(2*(i+1))
    return 0,{},str(err)
def _get(url):
    req=urllib.request.Request(url,headers=UA)
    class NoRedir(urllib.request.HTTPRedirectHandler):
        def redirect_request(self,*a,**k): return None
    op=urllib.request.build_opener(NoRedir)
    try:
        r=op.open(req,timeout=30); return r.status, dict(r.headers), r.read().decode("utf-8","replace")
    except urllib.error.HTTPError as e:
        return e.code, dict(e.headers), e.read().decode("utf-8","replace")
urls=[]
for sm in ["/sitemap.xml","/sitemaps/static.xml","/sitemaps/quizzes.xml"]:
    s,h,b=get(BASE+sm)
    found=re.findall(r"<loc>\s*([^<\s]+)\s*</loc>",b)
    print(sm,s,len(found),file=sys.stderr); urls+=found
urls=sorted(set(urls))
def one(u):
    s,h,b=get(u)
    f=lambda p: (m.group(1).strip() if (m:=re.search(p,b,re.I|re.S)) else "")
    meta=lambda name: f(r'<meta[^>]+(?:name|property)="%s"[^>]+content="([^"]*)"'%re.escape(name))
    jsonld=re.findall(r'"@type"\s*:\s*"([^"]+)"',b)
    text=re.sub(r"<script.*?</script>|<style.*?</style>|<[^>]+>"," ",b,flags=re.S)
    return {"url":u,"status":s,"location":h.get("Location",""),
      "title":f(r"<title[^>]*>(.*?)</title>"),"description":meta("description"),
      "canonical":f(r'<link[^>]+rel="canonical"[^>]+href="([^"]*)"'),
      "robots":meta("robots"),"og_locale":meta("og:locale"),"og_title":meta("og:title"),
      "html_lang":f(r'<html[^>]+lang="([^"]*)"'),
      "hreflang":";".join(re.findall(r'hreflang="([^"]+)"',b)),
      "h1":re.sub(r"<[^>]+>","",f(r"<h1[^>]*>(.*?)</h1>")).strip(),
      "jsonld_types":";".join(sorted(set(jsonld))),
      "text_hash":hashlib.sha1(" ".join(text.split()).encode()).hexdigest()[:12],
      "bytes":len(b)}
with cf.ThreadPoolExecutor(4) as ex: rows=list(ex.map(one,urls))
out=sys.argv[1]
json.dump(rows,open(out+".json","w"),ensure_ascii=False,indent=1)
w=csv.DictWriter(open(out+".csv","w",newline=""),fieldnames=list(rows[0].keys())); w.writeheader(); w.writerows(rows)
from collections import Counter
print("pages",len(rows),"status",Counter(r["status"] for r in rows))
print("no canonical",sum(1 for r in rows if not r["canonical"]),"canonical!=url",sum(1 for r in rows if r["canonical"] and r["canonical"].rstrip("/")!=r["url"].rstrip("/")))
print("noindex",sum(1 for r in rows if "noindex" in r["robots"]),"no desc",sum(1 for r in rows if not r["description"]),"dup titles",len(rows)-len(set(r["title"] for r in rows)))
print("lang",Counter(r["html_lang"] for r in rows),"hreflang",Counter(r["hreflang"] for r in rows).most_common(3))
print("jsonld",Counter(r["jsonld_types"] for r in rows).most_common(5))

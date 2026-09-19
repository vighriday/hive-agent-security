import re
import json

def style_to_react(style_str):
    if not style_str: return "{}"
    parts = style_str.split(';')
    obj = {}
    for p in parts:
        p = p.strip()
        if not p: continue
        if ':' not in p: continue
        k, v = p.split(':', 1)
        k = k.strip()
        v = v.strip()
        # camelCase the key
        k_parts = k.split('-')
        k = k_parts[0] + ''.join(x.capitalize() for x in k_parts[1:])
        obj[k] = v
    return json.dumps(obj)

with open("e:/Projects/HIVE_TLNHackathon/frontend/Layout language rebuild/HIVE.dc.html", "r", encoding="utf-8") as f:
    raw = f.read()

# Extract the <script> block and the <x-dc> block
script_match = re.search(r'<script type="text/x-dc" data-dc-script[^>]*>([\s\S]*?)</script>', raw)
script_content = script_match.group(1) if script_match else ""

xdc_match = re.search(r'<x-dc>([\s\S]*?)</x-dc>', raw)
xdc_content = xdc_match.group(1) if xdc_match else ""

# 1. Strip helmet and style (we will put styles in index.css)
xdc_content = re.sub(r'<helmet[^>]*>[\s\S]*?</helmet>', '', xdc_content)

# 2. Convert {{ var }} to {var}
xdc_content = re.sub(r'\{\{\s*(.*?)\s*\}\}', r'{\1}', xdc_content)

# 3. Convert style="..." to style={{...}}
def replace_style(m):
    return f"style={style_to_react(m.group(1))}"
xdc_content = re.sub(r'style="([^"]*)"', replace_style, xdc_content)

# 4. Convert style-hover to data-hover (we can handle it via CSS)
xdc_content = re.sub(r'style-hover="([^"]*)"', r'data-hover="\1"', xdc_content)

# 5. Convert class= to className=
xdc_content = re.sub(r'\bclass="', 'className="', xdc_content)

# 6. Convert <sc-for list="{list}" as="item">...<sc-for> to {list.map(item => (...))}
# This is tricky with regex, we will just use a generic conversion if possible.
# For simplicity, we will write it out as a plain string.

with open("temp.jsx", "w", encoding="utf-8") as f:
    f.write(xdc_content)
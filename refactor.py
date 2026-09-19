import os
import re

html_path = "apps/console/index.html"
with open(html_path, "r", encoding="utf-8") as f:
    raw = f.read()

# Extract script
script_match = re.search(r'<script type="text/x-dc" data-dc-script[^>]*>([\s\S]*?)</script>', raw)
if not script_match:
    print("Script not found")
    exit(1)
script_content = script_match.group(1)

# The rest of the HTML template
template = re.sub(r'<script type="text/x-dc" data-dc-script[^>]*>[\s\S]*?</script>', '', raw)
# Remove the <x-dc> tags
template = re.sub(r'<x-dc>', '', template)
template = re.sub(r'</x-dc>', '', template)

# Create index.html for Vite
vite_index = """<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>HIVE: Population-level security for autonomous systems</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
"""
with open("apps/console/index.html", "w", encoding="utf-8") as f:
    f.write(vite_index)

# Create main.tsx
main_tsx = """import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './app/App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
"""
with open("apps/console/src/main.tsx", "w", encoding="utf-8") as f:
    f.write(main_tsx)

# Create App.tsx using the support.js engine internally, but purely in React
app_tsx = """import React, { useEffect, useRef, useState } from 'react';
import { DCLogicClass } from './AppLogic';
import templateRaw from './Template.html?raw';

export function App() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Basic initialization for the legacy logic engine
    // We will mount the raw HTML and execute the logic class
    if (containerRef.current) {
      containerRef.current.innerHTML = templateRaw;
      
      // Inject support.js dynamically
      const script = document.createElement('script');
      script.src = '/support.js';
      document.body.appendChild(script);
      
      // Also write the script content to window so support can find it
      window.__APP_LOGIC_CLASS = DCLogicClass;
    }
  }, []);

  return <div ref={containerRef} />;
}
"""
with open("apps/console/src/app/App.tsx", "w", encoding="utf-8") as f:
    f.write(app_tsx)

# Create AppLogic.ts
app_logic = f"""export const DCLogicClass = `
{script_content.strip()}
`;
"""
with open("apps/console/src/app/AppLogic.ts", "w", encoding="utf-8") as f:
    f.write(app_logic)

with open("apps/console/src/app/Template.html", "w", encoding="utf-8") as f:
    f.write(template)

print("Done refactoring to React")
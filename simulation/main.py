import cgi
import urlparse
import SocketServer
import BaseHTTPServer

import subprocess
import json


PORT = 8081

def Validate(code):
  wrapped_code = "(function () { %s })\n" % code
  p = subprocess.Popen(['nodejs'], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
  out, err = p.communicate(input=wrapped_code)
  if p.returncode != 0:
    err_lines = err.split('\n')
    line = int(err_lines[1].split(':', 1)[1])
    hint = '\n'.join(err_lines[2:4])
    error = err_lines[4].split(':', 1)[1]
    return line, hint, error
  return None


def RunSimulation(spec):
  p = subprocess.Popen(['nodejs', 'main.js'], stdin=subprocess.PIPE, stdout=subprocess.PIPE)
  out, err = p.communicate(input=json.dumps(spec) + "\n")
  return out


class ServerHandler(BaseHTTPServer.BaseHTTPRequestHandler):
  def do_GET(self):
    self.send_response(404)
    self.end_headers()
    with open('index.html', 'r') as f:
      contents = ''.join(f.readlines())
      self.wfile.write(contents)
    self.wfile.close()

  def do_POST(self):
    length = int(self.headers.getheader('content-length'))
    raw_data = self.rfile.read(length)
    spec = json.loads(raw_data)
    
    self.send_response(200)
    self.send_header('Access-Control-Allow-Origin','*')
    self.end_headers()

    for player in spec['players']:
      error = Validate(player['logic'])
      if error:
        line, hint, details = error
        # TODO(wzoltak): It is ugly to handle it here :(.
        output = json.dumps([{
          'faction': player['name'],
          'type': 'OUTCOME',
          'outcome': 'ERROR',
          'stack': 'Syntax error at line %d: %s\n<pre>%s</pre>' % (line, details, hint)
        }])
        break
    else:
      output = RunSimulation(spec)
    self.wfile.write(output)
    self.wfile.close()


def Main():
  server_address = ('', PORT)
  httpd = BaseHTTPServer.HTTPServer(server_address, ServerHandler)
  httpd.serve_forever()

Main()

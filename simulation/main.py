import cgi
import urlparse
import SocketServer
import BaseHTTPServer

import json
import os
import subprocess

MODULE_DIR = os.path.dirname(__file__)

PORT = 8081

def Validate(code):
  wrapped_code = "(function () { %s })\n" % code
  p = subprocess.Popen(['nodejs'], cwd=MODULE_DIR,
                       stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                       stderr=subprocess.PIPE)
  out, err = p.communicate(input=wrapped_code)
  if p.returncode != 0:
    err_lines = err.split('\n')
    line = int(err_lines[1].split(':', 1)[1])
    hint = '\n'.join(err_lines[2:4])
    error = err_lines[4].split(':', 1)[1]
    return line, hint, error
  return None


def RunSimulation(spec):
  p = subprocess.Popen(['ulimit -v 1000000; timeout -s9 10s nodejs main.js'], cwd=MODULE_DIR,
                       stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                       shell=True)
  out, err = p.communicate(input=json.dumps(spec) + "\n")
  if p.returncode != 0:
    if 'Killed' in err:
      stack = 'Timeout while running match.'
    elif 'cannot allocate' in err or 'out of memory' in err:
      stack = 'Memory limit exceeded.'
    else:
      print err
      stack = 'Something went wrong :('
    return [{
      'faction': 'game',
      'type': 'OUTCOME',
      'outcome': 'ERROR',
      'stack': stack
    }]
  return json.loads(out)


def ValidateAndRun(spec):
  for player in spec['players']:
    error = Validate(player['logic'])
    if error:
      line, hint, details = error
      # TODO(wzoltak): It is ugly to handle it here :(.
      return [{
        'faction': player['name'],
        'type': 'OUTCOME',
        'outcome': 'ERROR',
        'stack': 'Syntax error at line %d: %s\n<pre>%s</pre>' % (line, details, hint)
      }]
    return RunSimulation(spec)


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
    output = json.dumps(ValidateAndRun(spec))
    
    self.send_response(200)
    self.send_header('Access-Control-Allow-Origin','*')
    self.end_headers()
    self.wfile.write(output)
    self.wfile.close()


def Main():
  server_address = ('', PORT)
  httpd = BaseHTTPServer.HTTPServer(server_address, ServerHandler)
  httpd.serve_forever()

if __name__ == '__main__':
  Main()

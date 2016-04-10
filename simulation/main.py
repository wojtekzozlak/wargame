import cgi
import urlparse
import SocketServer
import BaseHTTPServer

import subprocess
import json


PORT = 8081

def RunSimulation(spec):
  p = subprocess.Popen(['nodejs', 'main.js'], stdin=subprocess.PIPE, stdout=subprocess.PIPE)
  out, err = p.communicate(input=json.dumps(spec) + "\n")
  return out


spec = {
  'maxDurationMs': 120000,
  'players': [{
    'name': 'PlayerA',
    'logic': 'targetSpeed = 100;'
  }, {
    'name': 'PlayerB',
    'logic': 'targetAngle = targetAngle + relativeAngles[0];\n targetSpeed = 150;\n if (distances[0] < 150) { shoot = true; };'
  }]
}


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
    print raw_data
    spec = json.loads(raw_data)
    
    self.send_response(200)
    self.send_header('Access-Control-Allow-Origin','*')
    self.end_headers()

    output = RunSimulation(spec)
    self.wfile.write(output)
    self.wfile.close()


def Main():
  server_address = ('', PORT)
  httpd = BaseHTTPServer.HTTPServer(server_address, ServerHandler)
  httpd.serve_forever()

Main()

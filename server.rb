# Minimal static file server for local preview.
# WEBrick's default FileHandler calls getcwd on every request, which the
# sandbox blocks, so we mount our own proc that reads by absolute path.
require "webrick"

DOC  = "/Users/ext-anna.chirikalo/Desktop/receiptme"
PORT = (ARGV[0] || 5178).to_i

TYPES = {
  ".html" => "text/html; charset=utf-8",
  ".js"   => "text/javascript",
  ".css"  => "text/css",
  ".json" => "application/json",
  ".svg"  => "image/svg+xml",
  ".png"  => "image/png",
  ".jpg"  => "image/jpeg",
  ".jpeg" => "image/jpeg",
  ".ico"  => "image/x-icon",
}

srv = WEBrick::HTTPServer.new(Port: PORT, BindAddress: "127.0.0.1", AccessLog: [], Logger: WEBrick::Log.new($stderr, WEBrick::Log::WARN))

srv.mount_proc "/" do |req, res|
  rel  = req.path.split("?").first
  rel  = "/index.html" if rel == "/" || rel == ""
  file = File.join(DOC, rel)

  if !file.start_with?(DOC + "/") || file.include?("..") || !File.file?(file)
    res.status = 404
    res["Content-Type"] = "text/plain"
    res.body = "404 not found"
  else
    res["Content-Type"] = TYPES[File.extname(file).downcase] || "application/octet-stream"
    res["Cache-Control"] = "no-store"
    res.body = File.binread(file)
  end
end

trap("INT")  { srv.shutdown }
trap("TERM") { srv.shutdown }
puts "receiptme dev server on http://127.0.0.1:#{PORT}"
srv.start

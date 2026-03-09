import com.sun.net.httpserver.HttpServer;
import java.io.*;
import java.net.InetSocketAddress;
import java.nio.file.*;

public class Server {
    public static void main(String[] args) throws Exception {
        int port = 3000;
        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);
        String dir = System.getProperty("user.dir");

        server.createContext("/", exchange -> {
            String path = exchange.getRequestURI().getPath();
            if (path.equals("/")) path = "/index.html";
            File file = new File(dir + path);
            if (file.exists() && file.isFile()) {
                String ct = "text/html";
                if (path.endsWith(".css")) ct = "text/css";
                else if (path.endsWith(".js")) ct = "application/javascript";
                else if (path.endsWith(".json")) ct = "application/json";
                else if (path.endsWith(".png")) ct = "image/png";
                else if (path.endsWith(".jpg") || path.endsWith(".jpeg")) ct = "image/jpeg";
                else if (path.endsWith(".svg")) ct = "image/svg+xml";
                byte[] bytes = Files.readAllBytes(file.toPath());
                exchange.getResponseHeaders().set("Content-Type", ct + "; charset=UTF-8");
                exchange.sendResponseHeaders(200, bytes.length);
                exchange.getResponseBody().write(bytes);
            } else {
                String msg = "404 Not Found";
                exchange.sendResponseHeaders(404, msg.length());
                exchange.getResponseBody().write(msg.getBytes());
            }
            exchange.getResponseBody().close();
        });

        server.start();
        System.out.println("============================================");
        System.out.println("  Server running at http://localhost:" + port);
        System.out.println("============================================");
    }
}

import express from "express";
import { createServer as createViteServer } from "vite";
import { Client } from "@notionhq/client";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const PAGE_ID = process.env.NOTION_PAGE_ID || "3187fe3ab7c8807aa9e4ccc591769644";

async function getBlockChildren(blockId: string) {
  const children = [];
  let cursor;
  while (true) {
    const response: any = await notion.blocks.children.list({
      block_id: blockId,
      start_cursor: cursor,
    });
    children.push(...response.results);
    if (!response.has_more) break;
    cursor = response.next_cursor;
  }
  return children;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.get("/api/notion", async (req, res) => {
    console.log("Notion API Request Received");
    try {
      if (!process.env.NOTION_TOKEN) {
        console.warn("NOTION_TOKEN is missing from environment");
        return res.json({ 
          error: "TOKEN_MISSING",
          message: "Por favor, configura el NOTION_TOKEN en los Ajustes (Settings) de la plataforma.",
          inicio: "CONSTRUYENDO EL FUTURO",
          proyectos: [],
          servicios: []
        });
      }

      console.log("Fetching root blocks for Page ID:", PAGE_ID);
      const mainBlocks = await getBlockChildren(PAGE_ID);
      console.log(`Found ${mainBlocks.length} root blocks`);
      
      const data: any = {
        inicio: "",
        proyectos: [],
        servicios: []
      };

      const getPlainText = (block: any) => {
        const type = block.type;
        return block[type]?.rich_text?.[0]?.plain_text || block[type]?.title?.[0]?.plain_text || block.child_page?.title || "";
      };

      for (const block of mainBlocks) {
        const title = (block.toggle?.rich_text?.[0]?.plain_text || block.child_page?.title || "").toLowerCase();
        console.log(`- Parsing block title: "${title}" (Type: ${block.type})`);
        
        if (title.includes("inicio")) {
          console.log("  -> Processing 'inicio' section");
          const inicioBlocks = await getBlockChildren(block.id);
          const heading = inicioBlocks.find((b: any) => b.type.includes("heading"));
          data.inicio = heading ? getPlainText(heading) : "";
          console.log("     Result:", data.inicio);
        } else if (title.includes("proyectos")) {
          console.log("  -> Processing 'proyectos' section");
          const proyectosBlocks = await getBlockChildren(block.id);
          console.log(`     Found ${proyectosBlocks.length} project blocks`);
          for (const projBlock of proyectosBlocks) {
            const projTitle = getPlainText(projBlock) || projBlock.child_page?.title || "";
            if (!projTitle) continue;

            const projContent = await getBlockChildren(projBlock.id);
            const project: any = {
              title: "",
              category: "Web Design",
              image: "",
              fullDesc: "",
              tags: [],
              client: "Notion Client",
              year: new Date().getFullYear().toString()
            };

            for (const b of projContent) {
              const text = getPlainText(b);
              if (!text && b.type !== "image") continue;

              if (text.toLowerCase().includes("nombre proyecto:")) {
                project.title = text.split(":")[1]?.trim() || "";
              } else if (text.toLowerCase().includes("sobre el proyecto:")) {
                project.fullDesc = text.split(":")[1]?.trim() || "";
              } else if (text.toLowerCase().includes("tecnologías:") || text.toLowerCase().includes("tecnologias:")) {
                const tagsStr = text.split(":")[1] || "";
                project.tags = tagsStr.split(",").map((s: string) => s.trim()).filter(Boolean);
              } else if (text.toLowerCase() === "aplicativo web" || text.toLowerCase() === "web design") {
                project.category = text;
              } else if (b.type === "image") {
                project.image = b.image.file?.url || b.image.external?.url || "";
              }
            }
            if (project.title) {
              console.log(`     Added Project: ${project.title}`);
              data.proyectos.push(project);
            }
          }
        } else if (title.includes("servicios")) {
          console.log("  -> Processing 'servicios' section");
          const serviciosBlocks = await getBlockChildren(block.id);
          console.log(`     Found ${serviciosBlocks.length} service blocks`);
          for (const serviceBlock of serviciosBlocks) {
            const serviceToggleTitle = getPlainText(serviceBlock);
            const serviceContent = await getBlockChildren(serviceBlock.id);
            const service: any = {
              title: serviceToggleTitle || "Servicio",
              desc: "",
              image: ""
            };

            for (const b of serviceContent) {
              const text = getPlainText(b);
              if (text && !service.desc) {
                service.desc = text;
              } else if (b.type === "image") {
                service.image = b.image.file?.url || b.image.external?.url || "";
              }
            }
            console.log(`     Added Service: ${service.title}`);
            data.servicios.push(service);
          }
        }
      }

      res.json(data);
    } catch (error: any) {
      console.error("NOTION API CRITICAL ERROR:", error.message);
      res.status(500).json({ 
        error: "NOTION_FETCH_ERROR", 
        message: error.message,
        hint: "Asegúrate de que la página de Notion sea pública o que la integración tenga acceso."
      });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

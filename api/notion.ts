import { Client } from "@notionhq/client";
import type { VercelRequest, VercelResponse } from '@vercel/node';

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!process.env.NOTION_TOKEN) {
      return res.json({ 
        error: "TOKEN_MISSING",
        message: "Por favor, configura el NOTION_TOKEN en las variables de entorno de Vercel.",
        inicio: "CONSTRUYENDO EL FUTURO",
        proyectos: [],
        servicios: []
      });
    }

    const mainBlocks = await getBlockChildren(PAGE_ID);
    
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
      
      if (title.includes("inicio")) {
        const inicioBlocks = await getBlockChildren(block.id);
        const heading = inicioBlocks.find((b: any) => b.type.includes("heading"));
        data.inicio = heading ? getPlainText(heading) : "";
      } else if (title.includes("proyectos")) {
        const proyectosBlocks = await getBlockChildren(block.id);
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
            data.proyectos.push(project);
          }
        }
      } else if (title.includes("servicios")) {
        const serviciosBlocks = await getBlockChildren(block.id);
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
          data.servicios.push(service);
        }
      }
    }

    res.json(data);
  } catch (error: any) {
    console.error("NOTION API ERROR:", error.message);
    res.status(500).json({ 
      error: "NOTION_FETCH_ERROR", 
      message: error.message
    });
  }
}

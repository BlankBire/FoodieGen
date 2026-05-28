import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
// Debug import marker to surface module load-time errors in production logs
console.log("[TRACE] Loaded route: /api/projects/draft");

export async function POST(req: Request) {
  try {
    const { projectId, scriptId, topic, config, scenes } = await req.json();

    // Dùng userId mặc định cho hệ thống chưa có Auth
    const defaultUserId = "123e4567-e89b-12d3-a456-426614174000";

    // Đảm bảo user mặc định luôn tồn tại (xử lý fresh DB sau lần cài đặt mới)
    await prisma.user.upsert({
      where: { id: defaultUserId },
      update: {},
      create: {
        id: defaultUserId,
        email: "default@foodiegen.local",
        fullName: "FoodieGen User",
        passwordHash: "",
      },
    });

    // 1. Tìm hoặc Tạo Project — dùng upsert để xử lý projectId lỗi thời (đã bị xóa)
    let project;
    if (projectId) {
      project = await prisma.videoProject.upsert({
        where: { id: projectId },
        update: {
          storyTopic: topic,
          status: "draft",
        },
        create: {
          userId: defaultUserId,
          title: topic || "Bản nháp không tiêu đề",
          storyTopic: topic,
          status: "draft",
        },
      });
    } else {
      project = await prisma.videoProject.create({
        data: {
          userId: defaultUserId,
          title: topic || "Bản nháp không tiêu đề",
          storyTopic: topic,
          status: "draft",
        },
      });
    }

    // 2. Lưu nội dung vào VideoScript — dùng upsert để xử lý scriptId lỗi thời
    const contentPayload = {
      scenes: scenes || [],
      config: config || {},
    };

    let script;
    if (scriptId) {
      script = await prisma.videoScript.upsert({
        where: { id: scriptId },
        update: {
          content: JSON.stringify(contentPayload),
        },
        create: {
          projectId: project.id,
          content: JSON.stringify(contentPayload),
          isActive: true,
        },
      });
    } else {
      script = await prisma.videoScript.create({
        data: {
          projectId: project.id,
          content: JSON.stringify(contentPayload),
          isActive: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      projectId: project.id,
      scriptId: script.id,
      message: "Đã lưu bản nháp thành công!",
    });
  } catch (error: any) {
    console.error("[DRAFT-ERROR]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const defaultUserId = "123e4567-e89b-12d3-a456-426614174000";
    
    const projects = await prisma.videoProject.findMany({
      where: {
        userId: defaultUserId,
        status: "draft"
      },
      orderBy: {
        updatedAt: 'desc'
      },
      include: {
        scripts: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    return NextResponse.json({ success: true, data: projects });
  } catch (error: any) {
    console.error("[GET-DRAFT-ERROR]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');
    
    if (!projectId) {
      return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
    }

    await prisma.videoProject.delete({
      where: { id: projectId }
    });

    return NextResponse.json({ success: true, message: "Đã xóa bản nháp" });
  } catch (error: any) {
    console.error("[DELETE-DRAFT-ERROR]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { projectId, newTitle } = await req.json();

    if (!projectId || !newTitle) {
      return NextResponse.json({ error: "Missing projectId or newTitle" }, { status: 400 });
    }

    const project = await prisma.videoProject.update({
      where: { id: projectId },
      data: {
        title: newTitle
      }
    });

    return NextResponse.json({ success: true, project, message: "Đã đổi tên bản nháp" });
  } catch (error: any) {
    console.error("[RENAME-DRAFT-ERROR]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

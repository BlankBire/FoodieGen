import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
// Debug import marker to surface module load-time errors in production logs
console.log("[TRACE] Loaded route: /api/projects/draft");

export async function POST(req: Request) {
  try {
    const { projectId, scriptId, topic, config, scenes } = await req.json();

    // Dùng userId mặc định cho hệ thống chưa có Auth
    const defaultUserId = "123e4567-e89b-12d3-a456-426614174000";

    // 1. Tìm hoặc Tạo Project
    let project;
    if (projectId) {
      project = await prisma.videoProject.update({
        where: { id: projectId },
        data: {
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

    // 2. Lưu nội dung vào VideoScript (Bao gồm kịch bản và cấu hình UI)
    const contentPayload = {
      scenes: scenes || [],
      config: config || {},
    };

    let script;
    if (scriptId) {
      script = await prisma.videoScript.update({
        where: { id: scriptId },
        data: {
          content: JSON.stringify(contentPayload),
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
  return NextResponse.json({ status: "API is ready!" });
}

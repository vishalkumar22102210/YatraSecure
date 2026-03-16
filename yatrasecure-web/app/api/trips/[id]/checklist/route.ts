import { NextResponse } from 'next/server';
import { getAccessToken } from '@/app/lib/api';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/trips/${id}/checklist`, {
      method: 'GET',
      headers: { Authorization: authHeader },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/trips/${id}/checklist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: authHeader },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

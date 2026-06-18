import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>物理实验AI智能体</title>
        <meta name="description" content="通过自然语言模拟物理实验的AI智能体，支持3D可视化渲染" />
      </head>
      <body>{children}</body>
    </html>
  );
}
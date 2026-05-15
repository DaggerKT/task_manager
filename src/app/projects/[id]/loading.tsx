import { Card, Skeleton, Space } from "antd";

export default function ProjectDetailLoading() {
  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 24,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
        }}
      >
        <Skeleton
          active
          title={{ width: 288 }}
          paragraph={{ rows: 1, width: 384 }}
        />
        <Space>
          <Skeleton active title={{ width: 96 }} paragraph={false} />
          <Skeleton active title={{ width: 112 }} paragraph={false} />
          <Skeleton active title={{ width: 128 }} paragraph={false} />
        </Space>
      </div>
      <div
        style={{
          flex: 1,
          display: "flex",
          gap: 24,
          overflowX: "auto",
          paddingBottom: 16,
        }}
      >
        {[1, 2, 3].map((i) => (
          <Card key={i} style={{ flexShrink: 0, width: 320, borderRadius: 12 }}>
            <Skeleton active paragraph={{ rows: 4 }} />
          </Card>
        ))}
      </div>
    </div>
  );
}

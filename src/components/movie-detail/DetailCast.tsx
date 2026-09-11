import React from "react";
import { Link } from "@tanstack/react-router";

interface DetailCastProps {
  actors?: string[];
}

export const DetailCast: React.FC<DetailCastProps> = ({ actors = [] }) => {
  const cleanActors = actors.map((a) => a.trim()).filter(Boolean);

  // Helper to get initials from actor name
  const getInitials = (name: string) => {
    const parts = name.split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <article className="panel" id="castPanel">
      <div className="panel-head">
        <h2>Diễn viên chính {cleanActors.length > 0 ? `(${cleanActors.length})` : ""}</h2>
      </div>

      {cleanActors.length > 0 ? (
        <div className="cast" id="castList">
          {cleanActors.map((actorName, idx) => (
            <Link
              to="/actor"
              search={{ name: actorName, id: "" }}
              key={`${actorName}-${idx}`}
              className="person"
            >
              <div
                className="person-avatar-initials"
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: "50%",
                  background:
                    "linear-gradient(135deg, rgba(255, 91, 138, 0.25), rgba(255, 130, 164, 0.12))",
                  border: "1px solid rgba(255, 91, 138, 0.35)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: 16,
                  color: "#ffafc2",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.25)",
                  userSelect: "none",
                }}
                title={actorName}
              >
                {getInitials(actorName)}
              </div>
              <strong>{actorName}</strong>
              <small>Diễn viên</small>
            </Link>
          ))}
        </div>
      ) : (
        <div
          style={{
            padding: "24px 16px",
            textAlign: "center",
            color: "var(--muted)",
            fontSize: 13,
            lineHeight: 1.6,
          }}
        >
          Thông tin diễn viên đang được cập nhật từ máy chủ nguồn.
        </div>
      )}
    </article>
  );
};

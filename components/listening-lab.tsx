"use client";

import { useMemo, useState } from "react";
import { courseModules, levelOrder } from "@/lib/curriculum";
import type { LevelId } from "@/lib/types";
import { ListeningPlayer } from "./listening-player";

export function ListeningLab() {
  const [level, setLevel] = useState<LevelId>("A1");
  const [moduleIndex, setModuleIndex] = useState(0);
  const modules = useMemo(() => courseModules.filter((module) => module.level === level), [level]);
  const module = modules[moduleIndex % Math.max(1, modules.length)];

  return (
    <div className="lab-shell">
      <div className="lab-toolbar card">
        <div><span className="eyebrow">LISTENING PATH</span><strong>Work without the transcript first.</strong></div>
        <div className="segmented">{levelOrder.map((item) => <button type="button" key={item} className={level === item ? "active" : ""} onClick={() => { setLevel(item); setModuleIndex(0); }}>{item}</button>)}</div>
      </div>

      <div className="listening-library">
        <aside className="listening-index card">
          {modules.map((item, index) => <button type="button" key={item.slug} className={moduleIndex === index ? "active" : ""} onClick={() => setModuleIndex(index)}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{item.title}</strong><small>{item.listeningGenre}</small></div></button>)}
        </aside>
        <div>
          {module && <>
            <div className="lab-context card"><span className={"mini-level level-" + level.toLowerCase()}>{level}</span><div><span className="eyebrow">MODULE {module.index}</span><h2>{module.title}</h2><p>{module.scenario}</p></div></div>
            <ListeningPlayer task={module.lessons[3].listening} />
          </>}
        </div>
      </div>
    </div>
  );
}

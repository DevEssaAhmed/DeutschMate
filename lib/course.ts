import meta from "./content/meta.json";
import a1 from "./content/a1.json";
import a2 from "./content/a2.json";
import b1 from "./content/b1.json";
import b2 from "./content/b2.json";
import c1 from "./content/c1.json";
import type { CourseData, CourseUnit, LevelId } from "./types";

const units = [...a1, ...a2, ...b1, ...b2, ...c1] as unknown as CourseUnit[];

export const courseData: CourseData = {
  ...(meta as unknown as Omit<CourseData, "units">),
  units,
};

export { levelOrder } from "./curriculum";
export {
  courseModules,
  courseLessons,
  allRichVocabulary,
  allCurriculumGrammar,
  getModulesByLevel,
  getModule,
  getLesson,
  getAdjacentLessons,
  lessonsForSkill,
  competencyById,
  levelAssessments,
  curriculumStats,
} from "./curriculum";

export function getUnitsByLevel(level: LevelId) {
  return courseData.units.filter((unit) => unit.level === level);
}

export function getUnit(level: string, slug: string): CourseUnit | undefined {
  return courseData.units.find(
    (unit) => unit.level.toLowerCase() === level.toLowerCase() && unit.slug === slug,
  );
}

export function getAdjacentUnits(unit: CourseUnit) {
  const index = courseData.units.findIndex((item) => item.id === unit.id);
  return {
    previous: index > 0 ? courseData.units[index - 1] : undefined,
    next: index < courseData.units.length - 1 ? courseData.units[index + 1] : undefined,
  };
}

export const allVocabulary = courseData.units.flatMap((unit) =>
  unit.vocab.map((item) => ({ ...item, level: unit.level, unit: unit.title, unitId: unit.id })),
);

export const allGrammar = courseData.units.flatMap((unit) =>
  unit.grammar.map((item) => ({ ...item, level: unit.level, unit: unit.title, unitId: unit.id })),
);

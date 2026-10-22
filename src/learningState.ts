import {z} from 'zod';
import type {Question,Response,Card} from './core';

export type Stage='understand'|'explain'|'practise'|'review'|'remember';
export type ClassSummary={id:string;title:string;date:string;chapter?:string;topicIds?:string[];text:string;updatedAt:number};
export type SessionAttempt={id:string;questionId:string;response:Response;score:number;at:number;phase:'practice'|'retry'};
export type SessionReview={conceptId:string;missedQuestionIds:string[];question:Question|null};
export type StudySession={
 id:string;summaryId:string|null;title:string;summarySnapshot:string;conceptIds:string[];
 createdAt:number;updatedAt:number;status:'proposed'|'active'|'finished';stage:Stage;
 requestedCount:number;includeRetention:boolean;retentionQuestionIds:string[];
 questions:Question[];cards:Card[];reviews:SessionReview[];attempts:SessionAttempt[];
 responses:Record<string,Response>;hints:Record<string,number>;
 conceptIndex:number;questionIndex:number;reviewIndex:number;cardIndex:number;
 revealedCardIds:string[];cardReviews:{cardId:string;rating:string;at:number;due:number}[];
 chartKind:'scatter'|'line'|'histogram'|'bar'|null;chartAnswer:string;chartRevealed:boolean;chartDone:boolean;
 teachBack:Record<string,{text:string;submittedAt:number|null;checks:string[];quickQuestion?:Question;quickChoice?:string;quickChecked?:boolean}>;explainIndex:number;
 scrollY:number;
};

export function learningStateShape(question:z.ZodTypeAny,response:z.ZodTypeAny){
 const finite=z.number().finite();
 const count=finite.int().nonnegative();
 const card=z.object({id:z.string(),module:z.string(),front:z.string(),back:z.string(),source:z.string(),kind:z.string()});
 return {
  studyClassId:z.string().nullable().optional(),
  chartRuns:z.array(z.object({id:z.string(),lessonId:z.string(),at:finite,classId:z.string().nullable(),answer:z.object({chart:z.string(),x:z.string(),y:z.string(),aggregation:z.string(),group:z.string(),hint:count,attempts:count,accepted:z.boolean()})})).optional(),
  savedSheets:z.array(z.object({id:z.string(),name:z.string(),prompt:z.string(),topic:z.string(),classId:z.string().nullable(),updatedAt:finite,rows:z.array(z.object({item:z.string(),kind:z.string(),when:z.string(),syntax:z.string(),example:z.string(),result:z.string(),mistake:z.string()}))})).default([]),
  guidedCharts:z.record(z.string(),z.object({chart:z.string(),x:z.string(),y:z.string(),aggregation:z.string(),group:z.string(),hint:count,attempts:count,accepted:z.boolean()})).default({}),
  classSummaries:z.array(z.object({id:z.string(),title:z.string().max(160),date:z.string(),chapter:z.string().max(160).optional(),topicIds:z.array(z.string()).optional(),text:z.string().max(50000),updatedAt:finite})).default([]),
  studySessions:z.array(z.object({
   id:z.string(),summaryId:z.string().nullable(),title:z.string(),summarySnapshot:z.string().max(50000),conceptIds:z.array(z.string()),
   createdAt:finite,updatedAt:finite,status:z.enum(['proposed','active','finished']),stage:z.enum(['understand','explain','practise','review','remember']),
   requestedCount:count.max(10),includeRetention:z.boolean(),retentionQuestionIds:z.array(z.string()),
   questions:z.array(question),cards:z.array(card),reviews:z.array(z.object({conceptId:z.string(),missedQuestionIds:z.array(z.string()),question:question.nullable()})),
   attempts:z.array(z.object({id:z.string(),questionId:z.string(),response,score:finite,at:finite,phase:z.enum(['practice','retry'])})),
   responses:z.record(z.string(),response),hints:z.record(z.string(),count.max(2)),
   conceptIndex:count,questionIndex:count,reviewIndex:count,cardIndex:count,
   revealedCardIds:z.array(z.string()),cardReviews:z.array(z.object({cardId:z.string(),rating:z.enum(['Again','Hard','Good','Easy']),at:finite,due:finite})),
   teachBack:z.record(z.string(),z.object({text:z.string().max(50000),submittedAt:finite.nullable(),checks:z.array(z.string()),quickQuestion:question.optional(),quickChoice:z.string().optional(),quickChecked:z.boolean().optional()})).default({}),explainIndex:count.default(0),
   chartKind:z.enum(['scatter','line','histogram','bar']).nullable(),chartAnswer:z.string(),chartRevealed:z.boolean(),chartDone:z.boolean(),scrollY:count
  })).default([]),
  currentSessionId:z.string().nullable().default(null)
 };
}

export type SheetRow={item:string;kind:string;when:string;syntax:string;example:string;result:string;mistake:string};
export type SavedSheet={id:string;name:string;prompt:string;topic:string;classId:string|null;updatedAt:number;rows:SheetRow[]};
export type ChartAnswer={chart:string;x:string;y:string;aggregation:string;group:string;hint:number;attempts:number;accepted:boolean};

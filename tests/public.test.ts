import {describe,it,expect} from 'vitest';
import raw from '../src/data/public-bank.json';
import python from '../src/data/python-bank.json';
import additions from '../src/data/additions.json';
import {validateQuestion,createExam,grade} from '../src/core';
describe('public deployment content boundary',()=>{
 it('contains only independently authored validated questions with no raw source text',()=>{const qs=[...raw.questions,...additions,...python.questions];expect(qs).toHaveLength(97);for(const q of qs){expect(q.provenance_category).toBe('authored_aligned_practice');expect(q.status).toBe('validated');expect(q).not.toHaveProperty('raw_text');expect(()=>validateQuestion(q,[...raw.sources.map(s=>s.id),'PYDOC'])).not.toThrow()}});
 it('excludes original coffee model output, attachments, extract paths and quarantine',()=>{expect(raw.coffee_models).toEqual([]);expect(raw.quarantine).toEqual([]);for(const s of raw.sources){expect(s.path).toBe('');expect(s.extracted_path).toBe('');expect(s.sha256).toBe('');expect(s.filename).not.toMatch(/pdf|docx|pbix|\.md/)}expect(raw.coffee.description).toMatch(/synthetic/)});
 it('supports the full preferred mock with pending case review and correct rubric sums',()=>{const e=createExam([...raw.questions,...additions,...python.questions] as any,raw.cases as any,20,10,2,90);expect(e.questions).toHaveLength(30);expect(grade(e)).toMatchObject({objectiveMax:120,subjectiveMax:30,subjective:null,total:null,max:150});for(const c of raw.cases){expect(c.subquestions.length).toBeGreaterThanOrEqual(3);expect(c.subquestions.length).toBeLessThanOrEqual(6);expect(c.subquestions.reduce((n,s)=>n+s.max_marks,0)).toBe(15)}});
});

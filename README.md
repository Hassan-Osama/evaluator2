# Assignment 2 Evaluator (TypeScript decorators)

Grades student `.ts` submissions for Assignments 2-1 … 2-6 out of 80.

## Setup (once)
```bash
cd evaluator
npm install
npm test          # sanity check: reference solutions must score 80
```

## Grade
```bash
# one file
node grade.js path/to/student.ts -a 3

# a folder of submissions (recursive); assignment inferred from folder or file name
node grade.js submissions/ -o report
```
Assignment inference: a folder named `1`–`6` / `v3` / `assignment_2_3`, or a file name like `ali_v3.ts` / `ali_2_3.ts`.
Otherwise pass `-a N`. `-o report` writes `results.csv`, `results.json` and one `feedback/<student>.txt` per student.

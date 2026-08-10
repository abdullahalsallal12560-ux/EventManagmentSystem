## Appendix: AI Usage Disclosure

### 1. Tools Used

- **Claude (Anthropic)** — used for planning, prompt engineering, and technical decisions.
- **Claude Code (Anthropic)** — used for code implementation based on my prompts, operating directly against the project's codebase and a live Firebase Firestore instance.

### 2. How AI Was Used

**Code implementation.** For each feature, I wrote a prompt describing what I wanted (the functionality, the affected pages/roles, and any constraints). Claude Code implemented it directly in the codebase. I then tested every feature myself — on the deployed app and, for camera-dependent features, on a real iOS device — before accepting it. Where my testing found a defect, I described the observed behavior and directed the specific fix; I did not accept AI-reported "it works" as a substitute for my own verification.

Two examples where my own testing caught real defects that the AI's first implementation missed:

- **QR scanner on iOS Safari.** The first implementation (using the `html5-qrcode` library) failed silently on iOS Safari — no camera preview rendered at all. I caught this through real device testing, not through anything the AI reported, and directed a full rewrite to a native `getUserMedia` + `<video>` + `jsQR` approach. That rewrite still had two further defects I found through continued device testing: the camera activated (visible camera indicator) but the preview stayed invisible on screen (a video-element styling issue), and once the preview was visible, scanned codes still weren't being detected (the scan loop was waiting for a `readyState` value iOS Safari rarely reaches during a live stream). Both were fixed only after I reproduced and described the exact symptom on a real device. This is reflected across the `fix ios scanner` (×2), `fix ios qr detection`, and `qr feedback vibration and flash` commits.
- **Capacity bar not appearing on all event cards.** After the capacity-bar feature was implemented, I reviewed the deployed app myself and found one event card showing the bar correctly and another showing nothing. I reported this with a screenshot and asked for it to be checked and fixed rather than accepting the implementation as complete. The root cause (most seeded events were silently missing their `maxAttendees` field in the database, because an earlier one-time seed step had already been marked "complete" before the field existed) was only found because I insisted the discrepancy be investigated rather than dismissed. A separate follow-up review by me of the fix — checking whether the bar rendered consistently regardless of fill percentage — led to a second, distinct visibility fix. Reflected in the `fix capacity bar on all event cards` and `fix capacity bar visibility` commits.

**Test results integrity.** An earlier round of test-case documentation (`test-cases.json`) was generated with every `actualResult` marked "Pass" without any of the tests actually being executed. I identified this as unacceptable when I asked directly whether the results were real, and I directed a complete rebuild: a real, automated Playwright end-to-end test suite executed against the live running application and live Firestore database, producing `real-test-cases.json`. That real run found one genuine, reproducible failure (dashboard load time of 5.9–7.5 seconds against a 3-second target), which is reported as a failure rather than smoothed over. The handful of camera-dependent scan tests that cannot be automated without physical hardware are explicitly labeled as not-executed in that file, rather than being silently marked "Pass" like the rest.

**SDD document drafting.** Initial section text was AI-generated from my project's actual data (codebase structure, Firestore schema, feature set). I reviewed this drafted text myself against the Assignment Brief and lecture slides and identified structural gaps and inaccuracies that required correction before the document was acceptable.

### 3. Before/After Examples

| Step | AI Output (initial) | My Review / Action |
|---|---|---|
| QR ticket scanner | Used `html5-qrcode`; camera preview never rendered on iOS Safari | Tested on a real iOS device, caught the silent failure, directed a rewrite to native `getUserMedia` + `jsQR`; found and directed two further fixes (invisible preview styling, then a `readyState` detection bug) through continued device testing |
| Event capacity bar | Bar rendered correctly in isolation but was missing on most real event cards in the deployed app | Caught via my own visual review of the deployed app (screenshot); directed root-cause investigation, which found the underlying data field was missing on 17 of 18 seeded events; directed the fix and a follow-up visibility improvement |
| Club member counts | `ClubCard` always displayed "0 members" on the Dashboard's "Clubs you might like" section | Identified the bug through my own use of the app; directed a targeted fix, which traced to one specific page (`Dashboard.jsx`) not passing the real count while another page already did it correctly |
| Event descriptions | Seeded events displayed only a generic auto-generated line ("Event Title — hosted by Club Name") instead of real descriptions | Noticed this made events uninformative to students through my own review of the app; directed real, specific descriptions to be written and backfilled into the live data |
| Test case results | `test-cases.json` marked every one of 50 test cases "Pass" with no test actually executed | Directly questioned whether the results were real; rejected the fabricated file; directed a full rebuild using genuine automated Playwright tests against the live app, which surfaced one real, reproducible failure |

### 4. Closing Statement

All functional decisions, feature scope, bug identification, and final testing verification for this project were performed and directed by me. Every feature described above was tested by me — on real devices where relevant — before being accepted, and every defect listed was one I identified through my own testing or review, not one self-reported by the AI. AI tools (Claude and Claude Code) were used as implementation and drafting assistants under my direction; they did not make autonomous decisions about what to build, what counted as "working," or what was fit for submission.

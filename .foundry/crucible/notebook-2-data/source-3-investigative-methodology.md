# Investigative Methodology Manual: Fusing All-Source Intelligence with Financial and Political Datasets

### 1. The Paradigm of All-Source Intelligence in Influence Mapping

In the current operational environment, **all-source intelligence** is the systematic integration of information from every available collection discipline to produce a unified, actionable analytical product. Its strategic importance lies in its ability to mitigate "intelligence failure" by providing a holistic view that no single data stream can offer. The evolution of modern analysis is defined by a move away from "single-INT" silos—where Signal Intelligence (SIGINT) or Imagery Intelligence (IMINT) analysts worked in isolation—toward a total fusion of data. 

Historically, this shift was most pronounced in the transformation of IMINT into Geospatial Intelligence (GEOINT). Analysts no longer merely interpret static imagery; they synthesize relevant data from across the spectrum to depict geographically referenced activity. Post-9/11, the Intelligence Community accelerated this transition through collaborative tools like **A-Space** and **Intellipedia**, designed to break down institutional barriers. For the investigator, a "fusion" approach is the only viable method for identifying sophisticated patterns of influence. Sophisticated actors mask their intentions across various domains; therefore, the investigator must move beyond simple collection to **all-source analysis** to reveal the technological, financial, and political capabilities of a target. This broad framework serves as the foundation for the specialized datasets explored in this manual.

### 2. The Core Intelligence Disciplines: HUMINT, SIGINT, and OSINT

Traditional intelligence disciplines, once the exclusive domain of state espionage, are now repurposed to map the influence of corporate and political actors. By applying these methodologies to public datasets, an investigator can develop a comprehensive **Intelligence Collection Plan** to reconstruct a target's strategic intent.

| Discipline | Definition & Methodology |
| :--- | :--- |
| **HUMINT** | **Human Intelligence:** Gathered through interpersonal contact and relationship management. |
| **MASINT** | **Measurement and Signature Intelligence:** A technical branch that identifies the specific "signatures" of fixed or dynamic targets. |
| **SIGINT** | **Signals Intelligence:** Derived from the interception of signals, including communications and electronic traffic analysis. |
| **GEOINT** | **Geospatial Intelligence:** Depiction of physical features and activities through the analysis of imagery and geospatial data. |
| **OSINT** | **Open-Source Intelligence:** The transformation of publicly available data into an intelligence context to reveal capabilities. |
| **TECHINT** | **Technical Intelligence:** Focuses on the technological and weaponized capabilities of an adversary. |

The "So What?" of OSINT and Financial Intelligence (FININT) is found in the conversion of "available" data into "intelligence context." OSINT is not a mere news search; it is the extraction of military, technological, and financial insights from the public record. While these disciplines provide the "how" of collection, the SEC and FEC datasets provide the "what" for domestic influence mapping.

### 3. Financial Intelligence Layer: SEC Insider Transaction Analysis

Monitoring insider ownership is a critical **leading indicator** of corporate health and potential conflict of interest. Strategic intelligence operates on the premise that "insiders"—those with the most intimate knowledge of an entity—will act in their own economic self-interest. Federal law defines "insiders" as officers, directors, and any stakeholder holding >10% of a company’s securities.

These actors must adhere to strict filing timelines to maintain market transparency:
*   **Form 3:** Initial Statement of Beneficial Ownership. Must be filed within **10 days** of a person reaching "insider" status.
*   **Form 4:** Statement of Changes in Beneficial Ownership. Must be filed within **two business days** of a transaction. This is the primary document for active monitoring.
*   **Form 5:** Annual Statement of Beneficial Ownership. Filed **45 days** after the fiscal year ends to report exempt transactions or earlier failures to report.

#### Insider Transaction Code Analysis
Each transaction is coded to reveal the nature of the movement. Investigators must look beyond the "P" and "S" to find sophisticated maneuvers.

| Code | Transaction Type | Indicator Type | Investigator Significance |
| :--- | :--- | :--- | :--- |
| **P** | Market Purchase | Leading (Positive) | Demonstrates confidence in prospects; potential precursor to lobbying for favorable regulation. |
| **S** | Market Sale | Lagging (Negative) | May indicate liquidity needs or lack of confidence in near-term performance. |
| **K** | Equity Swaps/Hedging | **Critical Leading** | Indicates the insider is mitigating economic risk; suggests they are "betting against" their own public position. |
| **A** | Grant/Award | Neutral | Compensation-based; shows how the entity incentivizes the insider. |
| **M** | Exercise/Conversion | Neutral | Conversion of derivatives (options) into common stock. |
| **D** | Sale/Transfer to Co. | Neutral | Often an internal buy-back or transfer; not a market-driven move. |
| **F** | Tax/Exercise Payment | Neutral | Use of securities to cover tax liabilities. |
| **G** | Gift | Neutral/Variable | Can be used for estate planning or non-monetary influence. |
| **V** | Voluntary Report | Variable | A transaction reported on Form 4 before it was legally required. |
| **J** | Other | **High Risk** | Requires a footnote; often where complex, non-standard maneuvers are hidden. |

### 4. Political Intelligence Layer: The OpenSecrets Relational Framework

The OpenSecrets/CRP datasets provide a relational framework to identify the flow of money across campaign finance, lobbying, and personal finance. 

#### Relational Data Logic
Modern investigations require a fundamental understanding of relational systems. 
*   **API vs. Bulk Data:** For real-time analysis, the API provides calculated, current data. However, for deep-dive historical research, investigators must use **Bulk Data**. Note that bulk data **lags many months** behind the API—a critical red flag for time-sensitive investigations.
*   **Technical Warning (Dirty Data):** Major bulk tables use a non-standard format with **pipe delimiters (ascii 124)** and unprintable characters to handle "dirty" raw data that would choke standard CSV systems.

#### Standardizing Influence
To uncover the "So What?" of corporate influence, the investigator must utilize standardized fields:
*   **RealCode:** A five-character code identifying the donor's specific industry or ideology (e.g., C5120 for computer software).
*   **Orgname:** The standardized name of the donor's employer or organization.
*   **Ultorg:** The **Ultimate Parent Organization.** Identifying the "Ultorg" is the primary objective for uncovering the true source of corporate influence, as it links disparate subsidiaries back to a single power center.

#### Avoiding Analytical Pitfalls
*   **Double-Counting:** When combining Individual and PAC data, exclude individual contributions to PACs (unless they are leadership PACs) to avoid inflated totals.
*   **RecipCode Decoding:** Use the two-character code to identify the recipient's target block. The first character is Party (**D**emocrat, **R**epublican, **3**rd Party, **U**nknown); the second character is Status (**W**inner, **L**oser, **I**ncumbent, **C**hallenger, **O**pen Seat, **N**on-incumbent).
*   **Attribution & Legality:** Federal law **strictly prohibits** the use of contributor addresses for commercial solicitation. Furthermore, Creative Commons licenses require explicit **Attribution** to maintain nonpartisan credibility.

### 5. Advanced Synthesis: Identifying Conflicts of Interest and Influence Patterns

The core of the "Investigative Lead" persona is the ability to bridge disparate records into a cohesive **Intelligence Assessment**.

#### Calculating Influence
To identify a candidate’s primary backers, aggregate data across relevant cycles: **2 years for House** and **6 years (3 cycles) for Senate**. Use the "Ultorg" as the aggregation unit if multiple subsidiaries of the same parent are contributing.

#### Net Worth and Leverage Calculation
Using Personal Financial Disclosure (PFD) tables, calculate a target's wealth range using the following mandatory logic:
*   **The AssetExactValue Rule:** If the `AssetExactValue` field is populated, it **must** be used as both the minimum and maximum value, overriding any reported range.
*   **Net Worth Formula:** 
    *   *Minimum Net Worth* = (Sum of Minimum Assets) - (Sum of Maximum Debt).
    *   *Maximum Net Worth* = (Sum of Maximum Assets) - (Sum of Minimum Debt).
*   **Midpoint Valuation:** Use the midpoint of the resulting range for ranking filer wealth. This avoids distortions caused by filers who are "highly leveraged" (high assets but equally high debt).

#### Mapping Industry Logic (IncludeNSFS)
When linking lobbying expenditures to candidates, investigators must master the `IncludeNSFS` hierarchy to handle parent/subsidiary categorization:
*   **"c" and "b" Codes:** These are critical for handling parent companies with multiple business lines. If `IncludeNSFS` is "y," the parent captures subsidiary expenditures. If "n," they must be summed separately.
*   **The Fusion Point:** To identify a "defensible" conflict, cross-reference SEC **Form 4 "K" codes** (hedging) with specific **IssueID** fields in lobbying tables. If an insider is hedging their stock (protecting against a price drop) while their company is lobbying heavily on a specific bill (using the `Bill_Name` field), the investigator has identified a target "betting against" their own public influence campaign.

### 6. Methodology Summary and Quality Control

The application of this manual requires rigorous **Intelligence Cycle Management** to ensure findings are defensible under scrutiny.

1.  **The Necessity of All-Source Fusion:** Single-source data is prone to failure. An investigator must link corporate filings (SEC) with political beneficiaries (OpenSecrets) to understand the "why" behind an actor’s behavior.
2.  **Standardization as Key:** Data integrity depends on standardized IDs (CID, FECID) and the Ultorg. 
3.  **Data Anomalies (The Dole Factor):** Always check for footnotes (Transaction Code J). For example, the **DoleAssetFactors** in 2007 Senate data represent cases where standard ranges were insufficient, requiring the investigator to hunt for specific footnotes to maintain accuracy.
4.  **Analytical Probability:** Use terms like "midpoint net worth" and specific "transaction codes" to build a probabilistic argument rather than a mere list of facts.

**Ethical and Legal Notice:** Federal law prohibits the use of contributor names and addresses for commercial solicitation. All data utilized under Creative Commons licenses must be attributed to "OpenSecrets.org" to maintain professional and nonpartisan credibility. Failure to provide attribution or the use of data for commercial purposes without a license is a violation of the Terms of Service.
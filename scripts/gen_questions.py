"""
Generated questions appended to ob-final/questions.json.
All generated questions carry "source": "generated" so they can be
distinguished from the original slide-based questions at any time.

Target totals (original + generated):
  CH1:  24 + 4  = 28
  CH2:  15 + 13 = 28
  CH3:  20 + 8  = 28
  CH12: 13 + 15 = 28
  CH13:  6 + 22 = 28
  CH15: 24 + 10 = 34
  CH17: 21 + 8  = 29
  Total generated: 80
"""

import json
from pathlib import Path

BANK = Path("/Users/NachoDay2day/Desktop/Claudejects/CapitalBrainRot/content/missions/ob-final/questions.json")
data = json.loads(BANK.read_text())

def q(question, options, correctIndex, explanation, chapter):
    return {
        "question": question,
        "options": options,
        "correctIndex": correctIndex,
        "explanation": explanation,
        "chapter": chapter,
        "source": "generated",
    }

generated = [

    # ── CH1: 4 new ───────────────────────────────────────────────────────────
    q(
        "Which of the following best describes securitization?",
        [
            "Converting physical machinery into tradeable shares",
            "Packaging cash-flow-generating assets (e.g., mortgages) into tradeable securities",
            "Issuing shares to the public for the first time via an IPO",
            "Converting short-term corporate debt into long-term bonds",
        ],
        1,
        "Securitization pools assets whose cash flows back new tradeable securities, improving liquidity and allowing originators to transfer risk to capital markets.",
        "CH1",
    ),
    q(
        "Systemic risk refers to:",
        [
            "The risk that a single company will go bankrupt",
            "The risk of collapse of an entire financial system due to interconnected failures",
            "The risk that inflation will erode investment returns",
            "Market risk that cannot be eliminated through diversification",
        ],
        1,
        "Systemic risk is the danger that the failure of one institution cascades through the financial system — as seen in 2008 when Lehman's collapse threatened the entire global banking system.",
        "CH1",
    ),
    q(
        "Which of the following is a key difference between hedge funds and mutual funds?",
        [
            "Mutual funds can use leverage; hedge funds cannot",
            "Hedge funds are available to all retail investors; mutual funds are not",
            "Hedge funds are largely unregulated and restricted to wealthy or institutional investors",
            "Mutual funds typically employ short-selling and derivatives strategies",
        ],
        2,
        "Hedge funds are lightly regulated private partnerships typically restricted to accredited investors. They may use leverage, short selling, and derivatives — strategies generally unavailable to retail mutual funds.",
        "CH1",
    ),
    q(
        "In the top-down approach to portfolio construction, the correct order of analysis is:",
        [
            "Security selection → asset allocation → sector rotation",
            "Macroeconomic analysis → sector selection → individual security selection",
            "Security selection → macroeconomic analysis → sector selection",
            "Sector selection → security selection → asset allocation",
        ],
        1,
        "The top-down approach starts with the broad economy (macro), then identifies attractive industry sectors, and finally selects individual securities within those sectors.",
        "CH1",
    ),

    # ── CH2: 13 new ──────────────────────────────────────────────────────────
    q(
        "Treasury Inflation-Protected Securities (TIPS) protect investors against inflation by:",
        [
            "Paying a higher nominal coupon rate than regular Treasury bonds",
            "Adjusting the bond's principal value in line with the CPI",
            "Fixing the real return at a guaranteed rate above inflation",
            "Denominating payments in a foreign currency basket",
        ],
        1,
        "With TIPS, the principal is adjusted upward with the CPI. The fixed coupon rate is then applied to the adjusted principal, so the investor's real purchasing power is preserved.",
        "CH2",
    ),
    q(
        "The S&P 500 is a ________ index, while the Dow Jones Industrial Average is a ________ index.",
        [
            "Price-weighted; value-weighted",
            "Equally weighted; price-weighted",
            "Value-weighted (market-cap weighted); price-weighted",
            "Value-weighted; equally weighted",
        ],
        2,
        "The S&P 500 is market-cap weighted — larger companies exert more influence. The DJIA is price-weighted — higher-priced stocks have more influence regardless of total market value.",
        "CH2",
    ),
    q(
        "In a price-weighted index, if Stock A trades at $200 and Stock B trades at $50, Stock A has ________ the weight of Stock B in the index.",
        [
            "The same as",
            "Twice",
            "Four times",
            "Ten times",
        ],
        2,
        "In a price-weighted index, weight is proportional to share price. A $200 stock has 4× the index weight of a $50 stock, regardless of each company's total market capitalization.",
        "CH2",
    ),
    q(
        "In a value-weighted (market-cap weighted) index, a company's influence is determined by its:",
        [
            "Share price alone",
            "Number of shares outstanding alone",
            "Total market capitalization (price × shares outstanding)",
            "Earnings per share",
        ],
        2,
        "In a value-weighted index like the S&P 500, each company's weight = its total market cap / total market cap of all index constituents. Larger companies dominate.",
        "CH2",
    ),
    q(
        "Commercial paper is best described as:",
        [
            "Long-term bonds issued by commercial banks",
            "Short-term unsecured debt issued by large, creditworthy corporations",
            "Government-backed mortgage securities",
            "Certificates of deposit issued by the Federal Reserve",
        ],
        1,
        "Commercial paper is a short-term (typically 1–270 days) unsecured promissory note issued by corporations to finance short-term liabilities. It is a money market instrument.",
        "CH2",
    ),
    q(
        "A repurchase agreement (repo) is best described as:",
        [
            "A long-term bond with a fixed coupon",
            "A short-term collateralized loan where securities are sold with an agreement to repurchase them",
            "An agreement by a company to buy back its own stock",
            "A derivative contract on interest rates",
        ],
        1,
        "In a repo, one party sells securities and agrees to repurchase them at a slightly higher price. The difference is effectively the interest on a short-term secured loan.",
        "CH2",
    ),
    q(
        "The federal funds rate is:",
        [
            "The interest rate on 90-day Treasury bills",
            "The rate the Federal Reserve charges banks for emergency discount-window loans",
            "The rate at which banks lend reserve balances to each other overnight",
            "The interest rate on investment-grade commercial paper",
        ],
        2,
        "The federal funds rate is the overnight rate at which depository institutions lend reserve balances to each other. It is a key benchmark rate targeted by Federal Reserve monetary policy.",
        "CH2",
    ),
    q(
        "Preferred stock differs from common stock in that preferred stockholders:",
        [
            "Always have full voting rights at shareholder meetings",
            "Receive dividends only after common stockholders have been paid",
            "Receive fixed dividends that must be paid before any common dividends",
            "Have a residual claim on assets after all creditors and common stockholders",
        ],
        2,
        "Preferred stockholders receive a fixed dividend with priority over common dividends. However, they rank below debt holders in bankruptcy and typically lack voting rights.",
        "CH2",
    ),
    q(
        "A certificate of deposit (CD) is:",
        [
            "A government-issued bond with semi-annual coupon payments",
            "A bank-issued time deposit that pays a fixed interest rate at maturity",
            "A short-term government security sold at a discount",
            "A long-term corporate bond with a call provision",
        ],
        1,
        "CDs are time deposits issued by banks at a fixed interest rate and maturity date. Short-term CDs (under one year) are money market instruments.",
        "CH2",
    ),
    q(
        "Mortgage-backed securities (MBS) are created when:",
        [
            "A bank sells bonds to fund new mortgage lending",
            "Mortgages are pooled together and their cash flows are sold to investors as securities",
            "The government guarantees all outstanding mortgage loans",
            "Banks exchange mortgages with each other to reduce concentration risk",
        ],
        1,
        "In securitization, a pool of mortgages is assembled and the principal and interest cash flows are passed through to investors who hold MBS, separating loan origination from funding.",
        "CH2",
    ),
    q(
        "Eurodollar deposits are best described as:",
        [
            "Deposits held in European banks denominated in euros",
            "Dollar-denominated deposits held in banks outside the United States",
            "U.S. Treasury securities held by foreign central banks",
            "Currency swap agreements between U.S. and European banks",
        ],
        1,
        "Eurodollars are U.S. dollar deposits held in foreign banks (or foreign branches of U.S. banks). They are an important international money market instrument.",
        "CH2",
    ),
    q(
        "TIPS tend to have lower nominal yields than conventional Treasury bonds of the same maturity because:",
        [
            "TIPS carry higher default risk than conventional Treasuries",
            "TIPS offer inflation protection, so investors accept a lower real yield",
            "TIPS are issued less frequently, reducing their liquidity premium",
            "TIPS pay interest annually rather than semi-annually",
        ],
        1,
        "Because TIPS automatically adjust for inflation, the nominal yield on TIPS approximates the real interest rate. Conventional bonds include an inflation premium, making their nominal yield higher.",
        "CH2",
    ),
    q(
        "Which of the following is NOT a money market instrument?",
        [
            "Treasury bills",
            "Commercial paper",
            "10-year Treasury notes",
            "Repurchase agreements",
        ],
        2,
        "Money market instruments have maturities of one year or less. 10-year Treasury notes are capital market instruments. T-bills, commercial paper, and repos are all short-term money market instruments.",
        "CH2",
    ),

    # ── CH3: 8 new ───────────────────────────────────────────────────────────
    q(
        "A market order is best described as an order to:",
        [
            "Buy or sell a security at the best available current price",
            "Buy or sell only at a specified price or better",
            "Cancel a previous order if it has not yet been executed",
            "Buy or sell at the closing price of the trading day",
        ],
        0,
        "A market order executes immediately at the best price available. It prioritizes speed of execution over price certainty — the investor accepts whatever the current market price is.",
        "CH3",
    ),
    q(
        "A limit order differs from a market order in that a limit order:",
        [
            "Executes immediately at any available price",
            "Specifies a maximum price to pay (buy) or minimum price to accept (sell)",
            "Is only valid for one trading day by default",
            "Can only be placed by institutional investors",
        ],
        1,
        "A limit order sets a price boundary: a buy limit order executes at or below the limit price; a sell limit order executes at or above it. Execution is not guaranteed if the price never reaches the limit.",
        "CH3",
    ),
    q(
        "An investor holds shares of XYZ trading at $80 and places a stop-loss order at $70. This order will:",
        [
            "Automatically buy more shares if the price falls to $70",
            "Convert to a market sell order if the stock price falls to $70",
            "Sell shares immediately at exactly $70 regardless of market conditions",
            "Prevent the shares from being sold below $70",
        ],
        1,
        "A stop-loss order triggers a market sell order when the price hits the stop price ($70). It is designed to limit losses, but the actual execution price may be below $70 in a fast-falling market.",
        "CH3",
    ),
    q(
        "When an investor short-sells a stock, they must eventually:",
        [
            "Return the borrowed shares by purchasing them in the open market",
            "Return the borrowed shares by purchasing them directly from the issuer",
            "Pay the original lender a fee equal to the stock's price appreciation",
            "Hold the short position until the stock reaches zero",
        ],
        0,
        "A short seller borrows shares and sells them, hoping the price falls. To close the position (short covering), they must buy equivalent shares in the open market and return them to the lender.",
        "CH3",
    ),
    q(
        "When an investor receives a margin call, they are required to:",
        [
            "Close their entire position immediately",
            "Deposit additional funds or securities to restore the margin to the initial margin level",
            "Pay a penalty fee to the brokerage",
            "Reduce the position to whatever level current equity can support",
        ],
        1,
        "A margin call demands the investor deposit cash or securities to bring the account back up to the initial margin level. If they cannot, the broker may liquidate positions on their behalf.",
        "CH3",
    ),
    q(
        "In a private placement, securities are sold:",
        [
            "Through a stock exchange to the general public",
            "Directly to a small number of institutional or wealthy investors without a public offering",
            "At a discount to the current secondary market price",
            "Through a competitive bidding process on an exchange",
        ],
        1,
        "Private placements are exempt from full SEC registration. Securities are sold directly to accredited investors (e.g., pension funds, insurance companies), avoiding the cost and disclosure of a public offering.",
        "CH3",
    ),
    q(
        "Dark pools are trading venues that:",
        [
            "Allow anonymous trading of large blocks without pre-trade price transparency",
            "Execute trades only during after-hours sessions",
            "Are regulated exchanges with delayed quote reporting",
            "Specialize exclusively in derivatives and structured products",
        ],
        0,
        "Dark pools are private trading systems where large institutional orders execute without revealing size or price to the public market beforehand. This reduces market impact but raises concerns about price transparency.",
        "CH3",
    ),
    q(
        "Under Regulation T, the initial margin requirement is 50%. An investor wants to purchase $40,000 worth of stock. The minimum equity they must contribute is:",
        [
            "$10,000",
            "$20,000",
            "$30,000",
            "$40,000",
        ],
        1,
        "Initial margin of 50% means the investor funds half the purchase with their own equity. $40,000 × 50% = $20,000. The remaining $20,000 is borrowed from the broker on margin.",
        "CH3",
    ),

    # ── CH12: 15 new ─────────────────────────────────────────────────────────
    q(
        "The correct sequence of business cycle phases is:",
        [
            "Expansion → Peak → Recovery → Trough",
            "Peak → Recession → Recovery → Expansion",
            "Trough → Expansion → Peak → Contraction",
            "Contraction → Peak → Expansion → Trough",
        ],
        2,
        "The business cycle moves from trough (the low point) through expansion (growth) to peak (the high point) and then into contraction/recession before returning to trough.",
        "CH12",
    ),
    q(
        "Which of the following is a LEADING economic indicator?",
        [
            "Unemployment rate",
            "GDP growth rate",
            "Building permits for new private housing",
            "Average duration of unemployment",
        ],
        2,
        "Leading indicators change before the broader economy shifts. Building permits signal future construction activity. The unemployment rate and average duration of unemployment are lagging indicators.",
        "CH12",
    ),
    q(
        "The unemployment rate is classified as a ________ economic indicator because it typically:",
        [
            "Leading; falls before the economy enters recession",
            "Coincident; moves in lockstep with overall GDP",
            "Lagging; peaks after a recession has already ended",
            "Leading; rises before economic growth accelerates",
        ],
        2,
        "Unemployment is a lagging indicator — firms are slow to hire after a recession ends. The unemployment rate typically keeps rising for months after a recession officially concludes.",
        "CH12",
    ),
    q(
        "According to Porter's Five Forces, which of the following would DECREASE the threat of new entrants into an industry?",
        [
            "Low startup capital requirements",
            "Absence of proprietary technology among incumbents",
            "High economies of scale enjoyed by existing firms",
            "Easy access to distribution channels for new competitors",
        ],
        2,
        "High economies of scale create a cost disadvantage for new entrants who cannot yet match incumbents' production volumes. This acts as a structural barrier to entry.",
        "CH12",
    ),
    q(
        "In Porter's Five Forces, the threat of substitute products limits industry profitability by:",
        [
            "Reducing barriers to entry for new competitors",
            "Capping the prices firms can charge without losing customers to alternatives",
            "Increasing the bargaining power of input suppliers",
            "Forcing firms to increase capital expenditures",
        ],
        1,
        "When close substitutes exist, customers can switch easily, limiting an industry's pricing power and compressing profit margins.",
        "CH12",
    ),
    q(
        "Which of the following factors would INCREASE competitive rivalry within an industry?",
        [
            "High product differentiation among competitors",
            "Rapid industry growth providing room for all firms to expand",
            "High fixed costs relative to variable costs",
            "Low exit barriers allowing weak firms to leave easily",
        ],
        2,
        "High fixed costs pressure firms to compete aggressively on price to achieve volume and spread those fixed costs. Slow growth similarly intensifies competition for market share.",
        "CH12",
    ),
    q(
        "Which of the following is NOT a component of GDP under the expenditure approach (GDP = C + I + G + NX)?",
        [
            "Consumer spending (C)",
            "Government purchases (G)",
            "Net exports (NX)",
            "Stock market capital gains",
        ],
        3,
        "GDP = C + I + G + NX. Stock market capital gains are not included — they reflect transfers of existing wealth between investors, not new production of goods and services.",
        "CH12",
    ),
    q(
        "An unexpected large increase in oil prices that raises production costs across the economy is an example of a:",
        [
            "Positive demand shock",
            "Negative demand shock",
            "Positive supply shock",
            "Negative supply shock",
        ],
        3,
        "A supply shock affects production costs. A sharp rise in oil prices shifts the aggregate supply curve leftward — a negative supply shock causing stagflation (lower output, higher prices).",
        "CH12",
    ),
    q(
        "During the early expansion phase of the business cycle, investors practising sector rotation would most likely overweight:",
        [
            "Utilities and consumer staples",
            "Cyclicals such as industrials, materials, and consumer discretionary",
            "Healthcare and pharmaceuticals",
            "Precious metals and government bonds",
        ],
        1,
        "Early in an expansion, pent-up demand is released and cyclical industries (sensitive to economic growth) outperform. Defensives (utilities, staples) tend to outperform during recessions.",
        "CH12",
    ),
    q(
        "Which of the following pairs are BOTH considered defensive industries?",
        [
            "Automobiles and airlines",
            "Steel and construction",
            "Pharmaceuticals and utilities",
            "Semiconductors and luxury goods",
        ],
        2,
        "Defensive industries (pharmaceuticals, utilities, food) maintain relatively stable revenues regardless of the business cycle because their products are necessities with inelastic demand.",
        "CH12",
    ),
    q(
        "An analyst who starts by examining GDP trends, then identifies attractive sectors, and finally selects individual stocks is using a ________ approach.",
        [
            "Bottom-up fundamental",
            "Technical analysis",
            "Top-down",
            "Quantitative screening",
        ],
        2,
        "The top-down approach moves from macro (economy) → sector → individual security. The bottom-up approach starts with individual company analysis regardless of macroeconomic context.",
        "CH12",
    ),
    q(
        "In which stage of the industry life cycle would you expect the highest revenue growth rates but also the highest risk of business failure?",
        [
            "Maturity",
            "Consolidation",
            "Start-up",
            "Relative decline",
        ],
        2,
        "During the start-up stage, demand grows rapidly as new technology or products emerge. However, it is unclear which firms will survive the intense competition, making this the riskiest stage for investors.",
        "CH12",
    ),
    q(
        "Cost-push inflation differs from demand-pull inflation in that cost-push inflation is caused by:",
        [
            "Excess consumer demand driving prices above supply capacity",
            "Government fiscal deficits exceeding tax revenues",
            "Rising production costs (e.g., wages or raw materials) pushing prices higher",
            "An increase in the money supply lowering interest rates",
        ],
        2,
        "Demand-pull inflation is driven by excess demand. Cost-push (supply-side) inflation occurs when input costs rise, forcing firms to raise prices even without an increase in demand — often resulting in stagflation.",
        "CH12",
    ),
    q(
        "An inverted yield curve — where short-term interest rates are above long-term rates — is historically associated with:",
        [
            "Economic expansion and rising corporate profits",
            "A future recession",
            "Accelerating inflation expectations",
            "An increase in business investment spending",
        ],
        1,
        "An inverted yield curve has been one of the most reliable leading indicators of recession. It signals that the market expects future short-term rates (and economic activity) to fall.",
        "CH12",
    ),
    q(
        "A firm with high financial leverage (high debt-to-equity) will have ________ sensitivity to the business cycle compared to an otherwise identical firm with no debt.",
        [
            "Lower, because debt payments smooth out earnings fluctuations",
            "The same, because financial leverage does not affect earnings volatility",
            "Higher, because fixed interest payments amplify swings in net income",
            "Lower, because creditors absorb most of the downside risk",
        ],
        2,
        "Fixed interest obligations amplify earnings volatility. When revenues fall in a recession, a highly leveraged firm's net income drops proportionally more than an unlevered firm's, increasing business cycle sensitivity.",
        "CH12",
    ),

    # ── CH13: 22 new ─────────────────────────────────────────────────────────
    q(
        "According to the constant-growth DDM, the P/E ratio (P₀/E₁) of a stock equals:",
        [
            "D₁ / (k − g)",
            "(1 − b) / (k − g)",
            "ROE × b / k",
            "E₁ / (k − g)",
        ],
        1,
        "Dividing P₀ = D₁/(k−g) by E₁, and substituting D₁ = E₁(1−b) where b is the plowback ratio, gives P₀/E₁ = (1−b)/(k−g). Higher growth (g) or lower required return (k) raises the P/E.",
        "CH13",
    ),
    q(
        "The plowback ratio (also called the retention ratio) is defined as:",
        [
            "The fraction of earnings paid out as dividends",
            "The fraction of earnings reinvested back into the firm",
            "The ratio of retained earnings to total assets",
            "The ratio of dividends to book value per share",
        ],
        1,
        "The plowback ratio b = 1 − dividend payout ratio. It measures the fraction of earnings the firm retains for reinvestment rather than distributing as dividends.",
        "CH13",
    ),
    q(
        "The sustainable growth rate of a firm's earnings and dividends is given by:",
        [
            "g = ROE / b",
            "g = ROE + b",
            "g = ROE × b",
            "g = ROE − k",
        ],
        2,
        "g = ROE × b. A firm that earns a return on equity of ROE and reinvests fraction b of earnings will grow its book value — and thus future earnings and dividends — at rate ROE × b.",
        "CH13",
    ),
    q(
        "A stock with a high P/E ratio relative to industry peers most likely indicates that investors expect:",
        [
            "Lower-than-average future earnings growth for the firm",
            "Higher-than-average future earnings growth for the firm",
            "The company to pay out more dividends than its peers",
            "Higher risk with commensurately lower expected returns",
        ],
        1,
        "A high P/E means investors pay more per dollar of current earnings — typically because they expect earnings to grow rapidly. High PVGO is embedded in the high P/E.",
        "CH13",
    ),
    q(
        "A firm has ROE = 20% and a plowback ratio of 40%. Its sustainable growth rate is:",
        [
            "4%",
            "8%",
            "12%",
            "20%",
        ],
        1,
        "g = ROE × b = 0.20 × 0.40 = 0.08 = 8%.",
        "CH13",
    ),
    q(
        "If a stock's intrinsic value calculated via the DDM is $65 and the current market price is $80, an investor should:",
        [
            "Buy the stock immediately because high prices indicate quality",
            "Sell or avoid the stock since it appears overvalued",
            "Hold the stock because the market price is always correct",
            "Buy the stock because it will eventually reach intrinsic value",
        ],
        1,
        "If intrinsic value ($65) < market price ($80), the stock is overvalued — the market is paying more than the present value of expected future dividends. A rational investor should sell or avoid it.",
        "CH13",
    ),
    q(
        "The multistage dividend discount model is used when:",
        [
            "A firm pays no dividends at all",
            "A firm is expected to maintain a constant growth rate indefinitely",
            "A firm's growth rate is expected to change over time — e.g., an initial high-growth phase followed by stable long-run growth",
            "A firm's dividend policy is completely unknown",
        ],
        2,
        "The constant-growth DDM assumes perpetual stable growth. When a firm currently grows faster than its long-run sustainable rate, the multistage DDM explicitly models each growth phase before applying the Gordon model terminal value.",
        "CH13",
    ),
    q(
        "A firm will pay dividends of $3 at the end of year 3, after which dividends will grow at 5% forever. The required return is 10%. The terminal stock value at the end of year 3 is:",
        [
            "$60",
            "$63",
            "$50",
            "$30",
        ],
        1,
        "Terminal value = D₄ / (k − g) = (D₃ × 1.05) / (0.10 − 0.05) = ($3 × 1.05) / 0.05 = $3.15 / 0.05 = $63.",
        "CH13",
    ),
    q(
        "The formula P₀/E₁ = 1/k + PVGO/E₁ implies that a firm with zero growth opportunities would have a P/E ratio equal to:",
        [
            "g / k",
            "1 / k",
            "k / g",
            "1 / (k − g)",
        ],
        1,
        "If PVGO = 0, all earnings are paid as dividends and P₀ = E₁/k. The P/E collapses to 1/k — the reciprocal of the required return. This is the P/E of a no-growth perpetuity.",
        "CH13",
    ),
    q(
        "PVGO (Present Value of Growth Opportunities) is NEGATIVE when:",
        [
            "The firm retains no earnings",
            "The firm pays out all earnings as dividends",
            "The firm reinvests retained earnings at a rate below the required return (ROE < k)",
            "PVGO can never be negative",
        ],
        2,
        "If ROE < k, reinvesting destroys value — shareholders would be better off receiving cash as dividends. In this case PVGO is negative, and a higher payout ratio actually increases stock value.",
        "CH13",
    ),
    q(
        "Free Cash Flow to Equity (FCFE) is useful for valuing firms that:",
        [
            "Only have debt financing",
            "Pay dividends equal to their entire net income",
            "Pay low or no dividends but still generate significant cash flows",
            "Are in bankruptcy proceedings",
        ],
        2,
        "FCFE = cash available to equity holders after capex and debt obligations, regardless of what is actually paid as dividends. It is especially useful when dividends are not representative of the firm's true earnings power.",
        "CH13",
    ),
    q(
        "A price-to-book (P/B) ratio greater than 1 indicates that:",
        [
            "The stock is necessarily overvalued",
            "The market values the firm above its accounting net worth, reflecting intangibles and expected future profitability",
            "The firm has more debt than equity on the balance sheet",
            "Earnings per share exceed book value per share",
        ],
        1,
        "P/B > 1 means the market assigns value beyond the balance-sheet net assets. This premium reflects intangibles (brands, patents) and expectations that future returns will exceed the cost of equity.",
        "CH13",
    ),
    q(
        "If the earnings yield (E₁/P₀) of a stock is less than the required return k, this implies:",
        [
            "The stock is undervalued and should be purchased",
            "PVGO is negative and the firm destroys value by reinvesting",
            "PVGO is positive — the market is paying a premium for future growth opportunities",
            "The stock should be sold immediately",
        ],
        2,
        "P₀/E₁ = 1/k + PVGO/E₁. If E₁/P₀ < k, then P₀/E₁ > 1/k, meaning PVGO > 0. The market is pricing in valuable growth opportunities beyond a no-growth firm.",
        "CH13",
    ),
    q(
        "The Gordon Growth Model (constant-growth DDM) is MOST appropriate for valuing:",
        [
            "A startup in a high-growth phase with unpredictable dividends",
            "A company that pays no dividends",
            "A mature firm in a stable industry with dividends expected to grow at a steady rate indefinitely",
            "A company expected to be acquired within two years",
        ],
        2,
        "The Gordon model requires a constant, perpetual growth rate below k. It suits mature firms with predictable dividend policies in stable industries. It is inappropriate for high-growth firms with changing payout patterns.",
        "CH13",
    ),
    q(
        "Compared to a mature utility company, a high-growth technology firm would be expected to have a ________ P/E ratio.",
        [
            "Lower, due to higher risk",
            "The same, since P/E is industry-neutral",
            "Higher, because P/E rises with expected growth (g)",
            "Lower, because technology firms pay smaller dividends",
        ],
        2,
        "P/E = (1−b)/(k−g). A higher growth rate g raises the P/E multiple. Even if a tech firm pays no dividends (high b), its expected future g makes investors willing to pay more per current dollar of earnings.",
        "CH13",
    ),
    q(
        "If a firm increases its dividend payout ratio (reducing b), the net effect on stock price will be:",
        [
            "Always positive, since investors always prefer higher current dividends",
            "Ambiguous — higher payout raises D₁ but reduces g = ROE × b",
            "Always negative, since less reinvestment reduces firm value",
            "Neutral, since dividend policy never affects stock price",
        ],
        1,
        "Higher payout (lower b) raises D₁ but reduces g = ROE×b. If ROE > k, cutting b destroys value (growth is profitable). If ROE < k, cutting b creates value (growth destroys value). The outcome depends on ROE vs k.",
        "CH13",
    ),
    q(
        "The market capitalization rate (required return, k) for a stock is best estimated using:",
        [
            "k = rf + β × rM",
            "k = rf + β × (rM − rf)",
            "k = rM × β / rf",
            "k = D₁/P₀ + rf",
        ],
        1,
        "The CAPM gives k = rf + β(rM − rf), where rf is the risk-free rate, rM is the expected market return, and β measures the stock's systematic risk. This is the standard method to estimate the required return on equity.",
        "CH13",
    ),
    q(
        "A stock just paid a dividend of $2 (D₀ = $2). The required return is 12% and dividends are expected to grow at 6% forever. The intrinsic value P₀ is:",
        [
            "$16.67",
            "$35.33",
            "$33.33",
            "$17.67",
        ],
        1,
        "D₁ = D₀ × (1+g) = $2 × 1.06 = $2.12. P₀ = D₁ / (k−g) = $2.12 / (0.12−0.06) = $2.12 / 0.06 = $35.33.",
        "CH13",
    ),
    q(
        "A firm earns $5 per share (EPS = $5) and has a plowback ratio of 60%. The dividend per share is:",
        [
            "$1",
            "$2",
            "$3",
            "$5",
        ],
        1,
        "Dividend = EPS × (1 − b) = $5 × (1 − 0.60) = $5 × 0.40 = $2.00.",
        "CH13",
    ),
    q(
        "In equity valuation, a 'value stock' is typically characterised by:",
        [
            "High P/E and high P/B ratios with strong growth expectations",
            "Low P/E and low P/B ratios, suggesting the stock may be underpriced relative to fundamentals",
            "A high dividend growth rate exceeding the industry average",
            "Negative PVGO indicating poor investment prospects",
        ],
        1,
        "Value stocks trade at low multiples (low P/E, P/B) relative to fundamentals — often because the market is pessimistic about their prospects. Value investors seek these as potential bargains when the market has over-penalised them.",
        "CH13",
    ),
    q(
        "A firm has a required return of 10% and is expected to earn EPS of $4 next year. If it pays out all earnings as dividends (b = 0), what is its stock price under the DDM?",
        [
            "$10",
            "$20",
            "$40",
            "$4",
        ],
        2,
        "With b = 0, g = ROE × 0 = 0. D₁ = E₁ = $4. P₀ = D₁/k = $4/0.10 = $40. This is the no-growth case — the firm is valued as a perpetuity.",
        "CH13",
    ),
    q(
        "Which of the following best explains why two firms with identical earnings can have very different P/E ratios?",
        [
            "Differences in the number of shares outstanding",
            "Differences in accounting methods used to calculate earnings",
            "Differences in expected growth rates and return on equity (ROE vs k)",
            "Differences in the par value of shares",
        ],
        2,
        "P/E = (1−b)/(k−g). Firms with high expected growth (high ROE, high plowback) have high P/E multiples; firms with low growth or ROE < k trade at low P/E multiples, even with identical current earnings.",
        "CH13",
    ),

    # ── CH15: 10 new ─────────────────────────────────────────────────────────
    q(
        "Put-call parity states that for European options with the same strike and expiration:",
        [
            "Call price + Put price = Stock price + PV(X)",
            "Call price − Put price = Stock price − PV(X)",
            "Call price = Put price when the option is at the money",
            "Call price + Stock price = Put price + PV(X)",
        ],
        1,
        "Put-call parity: C − P = S₀ − PV(X). Equivalently, C + PV(X) = P + S₀. This no-arbitrage condition links call and put prices for European options on the same underlying with the same strike and maturity.",
        "CH15",
    ),
    q(
        "A European call costs $4. The stock price is $50, exercise price is $50, and the risk-free rate is 5% per year. Using put-call parity, the put price is approximately:",
        [
            "$1.62",
            "$2.38",
            "$4.00",
            "$5.62",
        ],
        0,
        "PV(X) = $50/1.05 = $47.62. Using C − P = S₀ − PV(X): 4 − P = 50 − 47.62 = 2.38. Therefore P = 4 − 2.38 = $1.62.",
        "CH15",
    ),
    q(
        "A protective put strategy involves:",
        [
            "Writing a put option on shares you already own",
            "Buying a put option on shares you already own",
            "Buying a call option to protect a short stock position",
            "Selling a call option to generate income on shares you hold",
        ],
        1,
        "A protective put = long stock + long put. The put acts as insurance: if the stock falls below the exercise price, the put gain offsets the stock loss, capping the maximum downside.",
        "CH15",
    ),
    q(
        "An investor buys a stock at $50 and buys a put with X = $45 for a $3 premium. The maximum loss on this combined position is:",
        [
            "$3",
            "$5",
            "$8",
            "Unlimited",
        ],
        2,
        "Maximum loss = (S₀ − X) + put premium = ($50 − $45) + $3 = $5 + $3 = $8. This occurs if the stock falls to $45 or below — the put caps the loss from the stock at $5, but the $3 premium is a sunk cost.",
        "CH15",
    ),
    q(
        "A covered call strategy involves:",
        [
            "Buying a call option while holding cash as collateral",
            "Buying a stock and a put option simultaneously",
            "Holding shares and writing (selling) a call option on those shares",
            "Writing a call option without owning the underlying shares",
        ],
        2,
        "A covered call = long stock + short call. The premium received provides downside cushion but caps the upside at the exercise price. It is 'covered' because the owned shares can be delivered if the call is exercised.",
        "CH15",
    ),
    q(
        "An investor holds a stock purchased at $60 and writes a call with X = $65 for a $4 premium. The maximum profit on this covered call position is:",
        [
            "$4",
            "$9",
            "$65",
            "Unlimited",
        ],
        1,
        "Maximum profit = (X − S₀) + premium = ($65 − $60) + $4 = $5 + $4 = $9. This is achieved when the stock price is at or above $65 at expiration and the call is exercised.",
        "CH15",
    ),
    q(
        "A bear spread with puts is constructed by:",
        [
            "Buying a low-strike put and selling a high-strike put",
            "Buying a high-strike put and selling a low-strike put",
            "Selling two puts at the same strike price",
            "Buying a put and a call at the same strike price",
        ],
        1,
        "A bear spread profits when the stock falls. With puts: buy the higher-strike put (more in the money when stock falls) and sell the lower-strike put (reduces cost but caps the maximum profit).",
        "CH15",
    ),
    q(
        "The intrinsic value of a call option with exercise price $50 on a stock trading at $58 is:",
        [
            "$0",
            "$8",
            "$50",
            "$58",
        ],
        1,
        "Intrinsic value of a call = max(0, S − X) = max(0, $58 − $50) = $8. This is the immediate exercise value — how much the holder would receive by exercising right now.",
        "CH15",
    ),
    q(
        "If a call option has an intrinsic value of $8 but is trading at $11, its time value is:",
        [
            "$3",
            "$8",
            "$11",
            "$19",
        ],
        0,
        "Option price = Intrinsic value + Time value. $11 = $8 + Time value → Time value = $3. Time value reflects the probability that the option will move further in the money before expiration.",
        "CH15",
    ),
    q(
        "Which of the following will INCREASE the value of BOTH a call and a put option on the same stock, all else equal?",
        [
            "A decrease in the stock price",
            "An increase in the exercise price",
            "An increase in the volatility of the underlying stock",
            "A decrease in the time to expiration",
        ],
        2,
        "Higher volatility increases the chance of large price swings in either direction. Since option holders benefit from large moves but their loss is capped at the premium paid, volatility always increases both call and put values.",
        "CH15",
    ),

    # ── CH17: 8 new ──────────────────────────────────────────────────────────
    q(
        "According to the cost-of-carry model, the fair futures price is:",
        [
            "F₀ = S₀ − rf × T",
            "F₀ = S₀ × (1 + rf)^T",
            "F₀ = S₀ / (1 + rf)^T",
            "F₀ = S₀ + rf / T",
        ],
        1,
        "F₀ = S₀ × (1+rf)^T. This reflects the cost of carrying (financing) the underlying asset from now until delivery. Any deviation creates a riskless arbitrage opportunity.",
        "CH17",
    ),
    q(
        "Which of the following is a key difference between forward contracts and futures contracts?",
        [
            "Futures are privately negotiated; forwards are exchange-traded",
            "Forwards require daily marking to market; futures do not",
            "Futures are standardised and exchange-traded; forwards are customised OTC contracts",
            "Forward contracts are backed by a clearinghouse; futures are not",
        ],
        2,
        "Futures are standardised contracts traded on exchanges with clearinghouse guarantees and daily mark-to-market. Forwards are customised, private OTC agreements — meaning they carry counterparty/credit risk and no daily settlement.",
        "CH17",
    ),
    q(
        "Basis risk in a futures hedge refers to:",
        [
            "The risk that the futures exchange will default on its obligation",
            "The risk that the basis (spot price minus futures price) will change unexpectedly",
            "The risk that the price of the underlying asset will fall",
            "The risk that the futures contract will expire before the hedge is needed",
        ],
        1,
        "The basis = spot price − futures price. A perfect hedge has constant (zero) basis change. In practice the basis fluctuates, meaning the futures position doesn't perfectly offset changes in the spot position — this is basis risk.",
        "CH17",
    ),
    q(
        "A portfolio manager holds $10 million in stocks with a beta of 1.2. Each S&P 500 futures contract covers $250,000. To fully hedge the portfolio, the manager should short:",
        [
            "40 contracts",
            "48 contracts",
            "50 contracts",
            "60 contracts",
        ],
        1,
        "Number of contracts = (Portfolio value × β) / Futures contract value = ($10,000,000 × 1.2) / $250,000 = $12,000,000 / $250,000 = 48 contracts.",
        "CH17",
    ),
    q(
        "A manager wants to reduce the beta of a $50 million portfolio from 1.5 to 0.5 using S&P 500 futures at $200,000 per contract. The number of contracts to SELL is:",
        [
            "125",
            "250",
            "375",
            "500",
        ],
        1,
        "Contracts = [(β_target − β_current) × Portfolio] / Futures price = [(0.5 − 1.5) × $50,000,000] / $200,000 = (−1.0 × $50,000,000) / $200,000 = 250 contracts (short).",
        "CH17",
    ),
    q(
        "An airline enters a forward contract with an oil supplier to buy fuel in 6 months at a fixed price. Compared to using exchange-traded futures, the main ADDITIONAL risk the airline faces is:",
        [
            "Basis risk from using an imperfect hedge",
            "Liquidity risk from not being able to exit the position",
            "Counterparty (credit) risk if the oil supplier defaults",
            "Margin risk from daily mark-to-market losses",
        ],
        2,
        "Forward contracts are OTC agreements with no clearinghouse backing. If the counterparty defaults before delivery, the hedger has no protection. Exchange-traded futures eliminate this through the clearinghouse guarantee.",
        "CH17",
    ),
    q(
        "Open interest in a futures market refers to:",
        [
            "The total number of futures contracts traded during a single day",
            "The total number of outstanding contracts not yet settled or delivered",
            "The difference between the highest and lowest futures prices on a given day",
            "The number of contracts available for trading on the exchange",
        ],
        1,
        "Open interest counts the total number of outstanding futures positions — each open contract has one long and one short side. It is distinct from daily trading volume, which counts contracts bought and sold on a given day.",
        "CH17",
    ),
    q(
        "A speculator buys crude oil futures contracts without holding any physical oil inventory. This is best described as:",
        [
            "Hedging against rising oil prices",
            "A long speculative position, betting that oil prices will rise",
            "Cross-hedging using a correlated commodity",
            "Short hedging to lock in a selling price",
        ],
        1,
        "A speculator takes on price risk for potential profit rather than to offset an existing exposure. Buying futures without owning the underlying is a naked long position — profitable if prices rise, but fully exposed to losses if they fall.",
        "CH17",
    ),
]

data.extend(generated)

BANK.write_text(json.dumps(data, indent=2))

# Summary
cs = {}
for q in data:
    c = q.get("chapter", "?")
    cs[c] = cs.get(c, 0) + 1

gen_cs = {}
for q in data:
    if q.get("source") == "generated":
        c = q.get("chapter", "?")
        gen_cs[c] = gen_cs.get(c, 0) + 1

print("Chapter | Original | Generated | Total")
print("--------|----------|-----------|------")
for ch in sorted(cs):
    orig = cs[ch] - gen_cs.get(ch, 0)
    gen  = gen_cs.get(ch, 0)
    total = cs[ch]
    print(f"  {ch}   |   {orig:3d}    |    {gen:3d}    |  {total:3d}")
print(f"\nTotal questions in bank: {len(data)}")
print(f"Total generated: {sum(gen_cs.values())}")

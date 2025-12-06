// ##############################################################################
// ############ MAKE ADJUSTMENTS HERE TO FIT YOUR SITUATION #####################
// ##############################################################################

// personals
const currentHomeSavings = 9400;
const currentEstimatedHomeProceeds = 72000; // estimated proceeds from selling current home (if any)
const maxMonthlyPayment = 2600; // maximum monthly payment you can afford (or want to pay)
const comfortableMonthlyPayment = 1900; // a more comfortable monthly payment amount (ideal scenario)
const estimatedMonthlySavingsAmount = 2000; // amount you intend to save each month towards home purchase
const maxYearsToCalculate = 3; // number of years to project into the future (as interest rates change longer periods become less accurate)

const calculateThirtyYearMortgage = true; // set to false to skip 30 year mortgage calculations
const calculateFifteenYearMortgage = false; // set to false to skip 15 year mortgage calculations
const doPMICalculations = false; // set to false to skip PMI calculations for home purchase with PMI

// current market rates
const thirtyYearFixedInterestRateAsPercent = 6.125;
const fifteenYearFixedInterestRateAsPercent = 5.5;
const yearlySavingsAccountRateAsPercent = 3.6;

// extra savings contributions at specific months (e.g., bonuses, tax returns, gifts, etc.)
// nothing by default
// Format: extraSavingsPeriods[monthIndex] = amount;
// Example: To add an extra $5000 in month 12 and $3000 in month 24, you would do:
// extraSavingsPeriods[12] = 5000;
// extraSavingsPeriods[24] = 3000;
const extraSavingsPeriods = {};

// assumptions
const yearlyTaxRateAsPercent = 1.5;
const yearlyPropertyInsuranceRateAsPercent = 0.39;
const yearlyHomeAppreciationRateAsPercent = 1.5;
const pmiRate = 0.75; // PMI rate as a percentage of loan amount (if applicable)
const maxHomePrice = 1_000_000; // upper limit for what calculations will consider (adjust if you're rich)

// ##############################################################################
// ############### END OF USER ADJUSTABLE SECTION ###############################
// ##############################################################################

// I wouldn't recommend changing anything below this line unless you know what you're doing 

// Convert percentages to decimals for calculations (making it easier to read above)
const thirtyYearFixedInterestRate = thirtyYearFixedInterestRateAsPercent / 100;
const fifteenYearFixedInterestRate = fifteenYearFixedInterestRateAsPercent / 100;
const yearlyTaxRate = yearlyTaxRateAsPercent / 100;
const yearlyPropertyInsuranceRate = yearlyPropertyInsuranceRateAsPercent / 100;
const yearlySavingsAccountRate = yearlySavingsAccountRateAsPercent / 100;
const yearlyHomeAppreciationRate = yearlyHomeAppreciationRateAsPercent / 100;
const pmiRateDecimal = pmiRate / 100;

const numberOfMonthsToCalculate = maxYearsToCalculate * 12;
const monthlySavingsAccountRate = yearlySavingsAccountRate / 12;
const monthlyHomeAppreciationRate = yearlyHomeAppreciationRate / 12;

const today = new Date();

function calculateMaxHomePrice(downPayment, annualInterestRate, maxMonthlyPayment, loanTermYears = 30) {
	const monthlyInterestRate = annualInterestRate / 12;
	const numberOfPayments = loanTermYears * 12;
	const epsilon = 1;

	// Start search range from downPayment up to an upper limit
	let low = downPayment;
	let high = maxHomePrice;

	while (high - low > epsilon) {
		const mid = (low + high) / 2;

		// Enforce 20% minimum down payment
		const minRequiredDown = mid * 0.20;

		if (downPayment < minRequiredDown) {
			high = mid;
			continue;
		}

		const loanAmount = mid - downPayment;

		const monthlyTaxes = (mid * yearlyTaxRate) / 12;
		const monthlyInsurance = (mid * yearlyPropertyInsuranceRate) / 12;

		const monthlyPI = (loanAmount * monthlyInterestRate) /
			(1 - Math.pow(1 + monthlyInterestRate, -numberOfPayments));

		const totalMonthlyPayment = monthlyPI + monthlyTaxes + monthlyInsurance;

		if (totalMonthlyPayment > maxMonthlyPayment) {
			high = mid;
			continue;
		} 
		low = mid;
		
	}

	return Math.round(low);
}

function calculateMaxHomePriceWithOptionalPMI(downPayment, annualInterestRate, maxMonthlyPayment, loanTermYears = 30) {
	const monthlyInterestRate = annualInterestRate / 12;
	const numberOfPayments = loanTermYears * 12;
	const epsilon = 1;

	let low = downPayment;
	let high = maxHomePrice;

	while (high - low > epsilon) {
		const mid = (low + high) / 2;

		const loanAmount = mid - downPayment;
		const downPaymentRatio = downPayment / mid;

		// Monthly costs
		const monthlyTaxes = (mid * yearlyTaxRate) / 12;
		const monthlyInsurance = (mid * yearlyPropertyInsuranceRate) / 12;

		const monthlyPI = (loanAmount * monthlyInterestRate) /
			(1 - Math.pow(1 + monthlyInterestRate, -numberOfPayments));

		// PMI only if down payment is less than 20%
		const monthlyPMI = downPaymentRatio < 0.20 ? (loanAmount * pmiRateDecimal) / 12 : 0;

		const totalMonthlyPayment = monthlyPI + monthlyTaxes + monthlyInsurance + monthlyPMI;

		if (totalMonthlyPayment > maxMonthlyPayment) {
			high = mid;
			continue;
		} 
		low = mid;
	}

	return Math.round(low);
}

function logHeaderLines(pmi = true) {
	const firstLine = pmi ? "------ Estimated Home buying power w/Potential PMI ------" : "------ Home buying power without PMI (min 20% down payment) ------";
	console.log(firstLine);
	
	let header = "Period      Down Payment\t";
	if (calculateThirtyYearMortgage) {
		header += "30 year range\t";
	}
	if (calculateFifteenYearMortgage) {
		header += "15 year range\t";
	}
	if (pmi) 
	{
		if (calculateThirtyYearMortgage) header += "30 Yr PMI?\t";
		if (calculateFifteenYearMortgage) header += "15 Yr PMI?\t";
	}
	console.log(header);
}

function logEntryLine(downPaymentEstimate, comfortableThirtyYearPurchasePrice, maxThirtyYearPurchasePrice, comfortableFifteenYearPurchasePrice, maxFifteenYearPurchasePrice, month, pmi = false, riskOfPMIOnThirtyYear = "NO", riskOfPMIOnFifteenYear = "NO", extraPaymentApplied = 0)
{
	const estimatedDownPaymentStr = downPaymentEstimate.toFixed(2);
	const thirtyYearRangeStr = `${comfortableThirtyYearPurchasePrice}-${maxThirtyYearPurchasePrice}`;
	const fifteenYearRangeStr = `${comfortableFifteenYearPurchasePrice}-${maxFifteenYearPurchasePrice}`;

	let dateToLog;
	dateToLog = new Date(today); 
	dateToLog.setMonth(today.getMonth() + month - 1);
	const monthStr = dateToLog.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });

	let line = monthStr  + "\t" + estimatedDownPaymentStr + "\t\t";
	if (calculateThirtyYearMortgage) {
		line += thirtyYearRangeStr + "\t";
	}
	if (calculateFifteenYearMortgage) {
		line += fifteenYearRangeStr + "\t";
	}

	if (pmi)
	{
		if (calculateThirtyYearMortgage) line += riskOfPMIOnThirtyYear + "\t\t\t";
		if (calculateFifteenYearMortgage) line += riskOfPMIOnFifteenYear + "\t";
	}

    if (extraPaymentApplied > 0) {
        line += `(Includes extra payment of $${extraPaymentApplied})`;
    }

	console.log(line);
}

function calculateHouseBuyingPowerOverTimeWithoutPMI() {
	logHeaderLines(false);

	let estimatedHomeSavings = currentHomeSavings;
	let estimatedHomeProceeds = currentEstimatedHomeProceeds;

	for (let month = 1; month < numberOfMonthsToCalculate + 1; month++) {
        let extraPaymentApplied = 0;
		estimatedHomeSavings = estimatedHomeSavings * (1 + monthlySavingsAccountRate);
		estimatedHomeSavings += estimatedMonthlySavingsAmount;
		if (extraSavingsPeriods[`${month}`]) {
            const extraSavings = extraSavingsPeriods[`${month}`];
            extraPaymentApplied = extraSavings;
            estimatedHomeSavings += extraSavings;
		}

		const downPaymentEstimate = estimatedHomeProceeds + estimatedHomeSavings;
		let maxThirtyYearPurchasePrice = 0;
		let comfortableThirtyYearPurchasePrice = 0;
		let maxFifteenYearPurchasePrice = 0;
		let comfortableFifteenYearPurchasePrice = 0;
		
		if (calculateThirtyYearMortgage) {
			maxThirtyYearPurchasePrice = calculateMaxHomePrice(downPaymentEstimate, thirtyYearFixedInterestRate, maxMonthlyPayment, 30);
			comfortableThirtyYearPurchasePrice = calculateMaxHomePrice(downPaymentEstimate, thirtyYearFixedInterestRate, comfortableMonthlyPayment, 30);
		}
		if (calculateFifteenYearMortgage) {
			maxFifteenYearPurchasePrice = calculateMaxHomePrice(downPaymentEstimate, fifteenYearFixedInterestRate, maxMonthlyPayment, 15);
			comfortableFifteenYearPurchasePrice = calculateMaxHomePrice(downPaymentEstimate, fifteenYearFixedInterestRate, comfortableMonthlyPayment, 15);
		}
        logEntryLine(downPaymentEstimate, comfortableThirtyYearPurchasePrice, maxThirtyYearPurchasePrice, comfortableFifteenYearPurchasePrice, maxFifteenYearPurchasePrice, month, false, "NO", "NO", extraPaymentApplied);
		
        estimatedHomeProceeds = estimatedHomeProceeds * (1 + monthlyHomeAppreciationRate);

		estimatedHomeSavings = Math.round(estimatedHomeSavings * 100) / 100;
		estimatedHomeProceeds = Math.round(estimatedHomeProceeds * 100) / 100;
	}
}
function calculateHouseBuyingPowerOverTimeWithPMI() {
	logHeaderLines(true);

	let estimatedHomeSavings = currentHomeSavings;
	let estimatedHomeProceeds = currentEstimatedHomeProceeds;

	for (let month = 1; month < numberOfMonthsToCalculate + 1; month++) {
		const downPayment = estimatedHomeProceeds + estimatedHomeSavings;
		let maxThirtyYearHomeAmount = 0;
		let comfortableThirtyYearHomeAmount = 0;
		let maxFifteenYearHomeAmount = 0;
		let comfortableFifteenYearHomeAmount = 0;

		if (calculateThirtyYearMortgage)
		{
			maxThirtyYearHomeAmount = calculateMaxHomePriceWithOptionalPMI(downPayment, thirtyYearFixedInterestRate, maxMonthlyPayment, 30);
			comfortableThirtyYearHomeAmount = calculateMaxHomePriceWithOptionalPMI(downPayment, thirtyYearFixedInterestRate, comfortableMonthlyPayment, 30);

		}

		if (calculateFifteenYearMortgage)
		{	
			maxFifteenYearHomeAmount = calculateMaxHomePriceWithOptionalPMI(downPayment, fifteenYearFixedInterestRate, maxMonthlyPayment, 15);
			comfortableFifteenYearHomeAmount = calculateMaxHomePriceWithOptionalPMI(downPayment, fifteenYearFixedInterestRate, comfortableMonthlyPayment, 15);
		}

		const riskOfPMIOnThirtyYear = Math.round((downPayment / maxThirtyYearHomeAmount) * 100) / 100 < .20 ? "YES" : "NO";
		const riskOfPMIOnFifteenYear = Math.round((downPayment / maxFifteenYearHomeAmount) * 100) / 100 < .20 ? "YES" : "NO";

		logEntryLine(downPayment, comfortableThirtyYearHomeAmount, maxThirtyYearHomeAmount, comfortableFifteenYearHomeAmount, maxFifteenYearHomeAmount, month, true, riskOfPMIOnThirtyYear, riskOfPMIOnFifteenYear);

		estimatedHomeSavings = estimatedHomeSavings * (1 + monthlySavingsAccountRate);
		estimatedHomeSavings += estimatedMonthlySavingsAmount;
		if (extraSavingsPeriods[`${month}`]) {
			estimatedHomeSavings += extraSavingsPeriods[`${month}`];
		}
		estimatedHomeProceeds = estimatedHomeProceeds * (1 + monthlyHomeAppreciationRate);

		estimatedHomeSavings = Math.round(estimatedHomeSavings * 100) / 100;
		estimatedHomeProceeds = Math.round(estimatedHomeProceeds * 100) / 100;
	}
}

function logAssumptions()
{
	console.log("Home calculations are based on the following assumptions:");
	console.log(`- Yearly Savings Account Rate: ${yearlySavingsAccountRateAsPercent}%`);
	console.log(`- Yearly Home Appreciation Rate: ${yearlyHomeAppreciationRateAsPercent}%`);
	console.log(`- Yearly Property Tax Rate: ${yearlyTaxRateAsPercent}%`);
	console.log(`- Yearly Property Insurance Rate: ${yearlyPropertyInsuranceRateAsPercent}%`);
	if (doPMICalculations) console.log(`- PMI Rate (if applicable): ${pmiRate}% of loan amount`);
	if (calculateThirtyYearMortgage) console.log(`- 30 Year Fixed Interest Rate: ${thirtyYearFixedInterestRateAsPercent}%`);
	if (calculateFifteenYearMortgage) console.log(`- 15 Year Fixed Interest Rate: ${fifteenYearFixedInterestRateAsPercent}%`);
	console.log("\nWith the following personal inputs:");
	console.log(`- Current Home Savings: $${currentHomeSavings}`);
	console.log(`- Current Estimated Home Proceeds: $${currentEstimatedHomeProceeds}`);
	console.log(`- Estimated Monthly Savings Amount: $${estimatedMonthlySavingsAmount}`);
	console.log(`- Maximum Monthly Payment: $${maxMonthlyPayment}`);
	console.log(`- Comfortable Monthly Payment: $${comfortableMonthlyPayment}`);
	console.log(`- Calculating for ${maxYearsToCalculate} years (${numberOfMonthsToCalculate} months)`);
}

function logDisclosure()
{
	console.log("\n");
	console.log("#############################################################");
	console.log("Disclosure: This is a simplified model for estimating home buying power.\nActual mortgage rates, taxes, insurance, and PMI may vary based on individual circumstances and market conditions.\nConsult with a financial advisor or mortgage professional for personalized advice.");
	console.log("##############################################################");
}

function calculateHouseBuyingPowerOverTime() {
	if (!calculateThirtyYearMortgage && !calculateFifteenYearMortgage) {
		console.log("No mortgage calculations selected. Please enable at least one mortgage type to calculate.");
		return;
	}	
	logAssumptions();
	logDisclosure();
	console.log("\n");
	
	calculateHouseBuyingPowerOverTimeWithoutPMI(numberOfMonthsToCalculate, monthlySavingsAccountRate, monthlyHomeAppreciationRate);
	
	if (doPMICalculations) {
		console.log("\n");
		calculateHouseBuyingPowerOverTimeWithPMI(numberOfMonthsToCalculate, monthlySavingsAccountRate, monthlyHomeAppreciationRate);
	}
	
}

calculateHouseBuyingPowerOverTime();

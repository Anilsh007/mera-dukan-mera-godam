import fs from "node:fs"
import path from "node:path"

const rootDir = path.resolve(process.cwd())
const envPath = path.join(rootDir, ".env.local")

loadEnvFile(envPath)

const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || ""
const keySecret = process.env.RAZORPAY_KEY_SECRET || ""

if (!keyId || !keySecret) {
  console.error("Missing NEXT_PUBLIC_RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET in .env.local")
  process.exit(1)
}

console.log(`Using Razorpay key id: ${maskValue(keyId)}`)

const planDefinitions = [
  { code: "STARTER_MONTHLY", name: "Starter Monthly", amount: 29900, period: "monthly", interval: 1 },
  { code: "STARTER_QUARTERLY", name: "Starter Quarterly", amount: 79900, period: "monthly", interval: 3 },
  { code: "STARTER_YEARLY", name: "Starter Yearly", amount: 299900, period: "yearly", interval: 1 },
  { code: "PRO_MONTHLY", name: "Pro Monthly", amount: 59900, period: "monthly", interval: 1 },
  { code: "PRO_QUARTERLY", name: "Pro Quarterly", amount: 159900, period: "monthly", interval: 3 },
  { code: "PRO_YEARLY", name: "Pro Yearly", amount: 599900, period: "yearly", interval: 1 },
  { code: "BUSINESS_MONTHLY", name: "Business Monthly", amount: 99900, period: "monthly", interval: 1 },
  { code: "BUSINESS_QUARTERLY", name: "Business Quarterly", amount: 269900, period: "monthly", interval: 3 },
  { code: "BUSINESS_YEARLY", name: "Business Yearly", amount: 999900, period: "yearly", interval: 1 },
]

const authHeader = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`

const created = []
for (const plan of planDefinitions) {
  const response = await fetch("https://api.razorpay.com/v1/plans", {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      period: plan.period,
      interval: plan.interval,
      item: {
        name: plan.name,
        amount: plan.amount,
        currency: "INR",
        description: `${plan.name} test plan for Dugam`,
      },
      notes: {
        envKey: `RAZORPAY_PLAN_ID_${plan.code}`,
      },
    }),
  })

  const text = await response.text()
  if (!response.ok) {
    console.error(`Failed to create ${plan.name}: ${text}`)
    if (response.status === 401) {
      console.error("Razorpay returned 401 Unauthorized.")
      console.error("Check that .env.local contains the correct Test Key ID and Test Key Secret with no extra spaces or quotes.")
      console.error("If needed, regenerate the test secret from Razorpay Dashboard and update .env.local.")
    }
    process.exit(1)
  }

  const data = JSON.parse(text)
  created.push({
    envKey: `RAZORPAY_PLAN_ID_${plan.code}`,
    id: data.id,
    name: plan.name,
  })
}

console.log("")
console.log("Created Razorpay test plans:")
for (const plan of created) {
  console.log(`${plan.name}: ${plan.id}`)
}

console.log("")
console.log("Add these to .env.local:")
for (const plan of created) {
  console.log(`${plan.envKey}=${plan.id}`)
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return

  const contents = fs.readFileSync(filePath, "utf8")
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith("#")) continue

    const separatorIndex = line.indexOf("=")
    if (separatorIndex === -1) continue

    const key = line.slice(0, separatorIndex).trim()
    const value = line.slice(separatorIndex + 1).trim()
    if (!key || process.env[key]) continue
    process.env[key] = stripQuotes(value)
  }
}

function stripQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1)
  }

  return value
}

function maskValue(value) {
  if (value.length <= 8) return value
  return `${value.slice(0, 8)}...${value.slice(-4)}`
}

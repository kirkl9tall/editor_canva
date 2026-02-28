import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
    const user = await prisma.user.findFirst()
    if (!user) {
        console.log("No user found. Please create an account via UI first.")
        return
    }

    const apiKey = await prisma.apiKey.findFirst({ where: { userId: user.id } })
    if (!apiKey) {
        console.log(`No API key found for user ${user.id}. Please generate one in the dashboard.`)
        return
    }

    const template = await prisma.template.findFirst({ where: { userId: user.id } })
    if (!template) {
        console.log(`No template found for user ${user.id}. Please create a template in the dashboard.`)
        return
    }

    console.log("Found API Key:", apiKey.key)
    console.log("Found Template ID:", template.id)

    // Try sending a POST request to localhost:3000
    console.log("\nSending test request to http://localhost:3000/api/v1/images...")
    try {
        const res = await fetch("http://localhost:3000/api/v1/images", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey.key}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                template_id: template.id,
                modifications: {
                    // just generic mappings, since we dont know the exact layer names
                    title: "API Generation Test",
                    name: "Test User"
                }
            })
        })

        const data = await res.json()
        console.log("Response Status:", res.status)
        console.log("Response Body:", data)
    } catch (err: any) {
        console.error("Error making request:", err.message)
    }
}

main().finally(() => prisma.$disconnect())

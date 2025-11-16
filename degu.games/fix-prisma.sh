#!/bin/bash

echo "🔧 Fixing Prisma Client..."
echo ""

cd packages/api

echo "1️⃣ Generating Prisma Client..."
npm run db:generate

if [ $? -ne 0 ]; then
    echo "❌ Prisma generation failed"
    echo ""
    echo "Try manually:"
    echo "cd packages/api"
    echo "npx prisma generate"
    exit 1
fi

echo "✅ Prisma client generated successfully"
echo ""

echo "2️⃣ Running database migration..."
echo "⚠️  When prompted, enter migration name: add_web3auth_fields"
echo ""

npm run db:migrate

if [ $? -ne 0 ]; then
    echo "❌ Migration failed"
    echo ""
    echo "Try manually:"
    echo "cd packages/api"
    echo "npx prisma migrate dev --name add_web3auth_fields"
    exit 1
fi

echo ""
echo "✅ Migration completed successfully"
echo ""
echo "🎉 Prisma is now fixed!"
echo ""
echo "You can now start the server:"
echo "cd packages/api && npm run dev"
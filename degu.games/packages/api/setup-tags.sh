#!/bin/bash

# Script to setup tags feature for projects
# This will regenerate Prisma client and run migrations

echo "🔧 Setting up tags feature..."
echo ""

echo "Step 1: Generating Prisma client..."
npm run db:generate

if [ $? -ne 0 ]; then
    echo "❌ Failed to generate Prisma client"
    exit 1
fi

echo "✅ Prisma client generated successfully"
echo ""

echo "Step 2: Running database migration..."
npm run db:migrate -- --name add_tags_to_projects

if [ $? -ne 0 ]; then
    echo "❌ Failed to run migration"
    exit 1
fi

echo "✅ Migration completed successfully"
echo ""
echo "🎉 Tags feature is now ready to use!"
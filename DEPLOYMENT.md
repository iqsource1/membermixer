# Deployment Guide

This guide walks you through deploying Member Mixer to Vercel.

## Prerequisites

- GitHub account
- Vercel account
- Whop app credentials
- Pusher account

## Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

## Step 2: Import to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New Project"
3. Import your GitHub repository
4. Select the repository: `membermixr`

## Step 3: Configure Environment Variables

In Vercel project settings, add these environment variables:

### Whop Configuration
```
NEXT_PUBLIC_WHOP_CLIENT_ID=your_whop_client_id
WHOP_SECRET_KEY=your_whop_secret_key
WHOP_WEBHOOK_SECRET=your_whop_webhook_secret
NEXT_PUBLIC_WHOP_ENVIRONMENT=production
```

### Pusher Configuration
```
NEXT_PUBLIC_PUSHER_APP_KEY=your_pusher_app_key
PUSHER_APP_ID=your_pusher_app_id
PUSHER_APP_SECRET=your_pusher_app_secret
NEXT_PUBLIC_PUSHER_CLUSTER=us2
```

### App Configuration
```
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

**Note**: Vercel KV variables are automatically added when you create a KV database.

## Step 4: Set Up Vercel KV

1. In your Vercel project, go to the "Storage" tab
2. Click "Create Database"
3. Select "KV"
4. Name it (e.g., `membermixr-kv`)
5. Select region (same as your app region for best performance)
6. Click "Create"

The KV environment variables will be automatically added to your project:
- `KV_URL`
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `KV_REST_API_READ_ONLY_TOKEN`

## Step 5: Deploy

1. Click "Deploy"
2. Wait for build to complete
3. Note your deployment URL: `https://your-project.vercel.app`

## Step 6: Configure Whop Webhooks

1. Go to [Whop Developer Portal](https://whop.com/developers)
2. Select your app
3. Go to "Webhooks" section
4. Add webhook endpoint: `https://your-project.vercel.app/api/webhook`
5. Select events to listen for:
   - `checkout.completed`
   - `subscription.created`
   - `subscription.updated`
   - `subscription.cancelled`
   - `subscription.expired`
6. Copy the webhook secret
7. Add it to Vercel environment variables as `WHOP_WEBHOOK_SECRET`

## Step 7: Update OAuth Redirect URIs

1. In Whop Developer Portal, go to OAuth settings
2. Add production redirect URI:
   - `https://your-project.vercel.app/auth/callback`
3. Save changes

## Step 8: Configure Pusher CORS

1. Go to [Pusher Dashboard](https://dashboard.pusher.com)
2. Select your app
3. Go to "App Settings"
4. Under "CORS", add your domain:
   - `https://your-project.vercel.app`
5. Save changes

## Step 9: Test the Deployment

### Test Authentication
1. Visit your deployed app
2. Try to access `/profile` - should redirect to Whop login
3. Log in and verify redirect back works

### Test Matching
1. Create a profile with interests
2. Try to find a match
3. Verify error handling when no matches available

### Test Payments
1. Reach match limit (use 5 free matches)
2. Try to match again
3. Verify upgrade prompt appears
4. Test checkout flow (use Whop test mode)

### Test Webhooks
1. In Whop dashboard, trigger a test webhook
2. Check Vercel logs for webhook receipt
3. Verify webhook processing works

## Post-Deployment Checklist

- [ ] All environment variables are set
- [ ] KV database is connected and accessible
- [ ] Whop webhooks are configured and tested
- [ ] OAuth redirects work correctly
- [ ] Pusher real-time messaging works
- [ ] Payment flow is tested (in test mode)
- [ ] All pages load without errors
- [ ] Mobile responsiveness is verified
- [ ] Error handling works as expected

## Monitoring

### Vercel Dashboard
- Check deployment logs
- Monitor function execution time
- Track error rates
- View KV database metrics

### Useful Commands
```bash
# View logs
vercel logs

# Check deployment status
vercel inspect <deployment-url>

# Roll back to previous deployment
vercel rollback
```

## Troubleshooting

### Build Fails
- Check Vercel build logs
- Ensure all dependencies are in `package.json`
- Verify TypeScript compilation works locally

### Environment Variables Not Working
- Make sure they're added in Vercel dashboard
- Redeploy after adding new variables
- Check variable names match exactly (case-sensitive)

### KV Connection Issues
- Verify KV database is created
- Check region matches your app region
- Ensure environment variables are set

### Webhook Not Receiving Events
- Verify webhook URL is correct
- Check webhook secret matches
- Look for webhook delivery attempts in Whop dashboard
- Check Vercel function logs

### Pusher Connection Fails
- Verify all Pusher credentials are correct
- Check CORS settings include your domain
- Ensure cluster setting matches your Pusher app

## Scaling Considerations

### Free Tier Limits
- Vercel: 100GB bandwidth, 100 GB-hours compute
- Pusher: 200k messages/day, 100 concurrent connections
- KV: Check your plan limits

### Upgrading
When you need to scale:
1. Upgrade Vercel plan for more bandwidth/compute
2. Upgrade Pusher for more connections
3. Consider KV plan limits and upgrade if needed
4. Monitor function execution times

## Security Best Practices

1. Never commit `.env` file
2. Rotate secrets regularly
3. Use Vercel's environment variable encryption
4. Enable Vercel's password protection for staging
5. Monitor webhook deliveries for suspicious activity
6. Set up alerts for failed API calls

## Continuous Deployment

Vercel automatically deploys:
- **Production**: `main` branch → your-project.vercel.app
- **Preview**: Pull requests → unique preview URLs

To customize:
1. Go to Project Settings → Git
2. Configure branch settings
3. Set up preview deployments

## Custom Domain (Optional)

1. In Vercel project settings, go to "Domains"
2. Add your custom domain
3. Update DNS records as instructed
4. Wait for DNS propagation
5. Update Whop OAuth redirect URIs
6. Update Pusher CORS settings

---

## Need Help?

- Vercel Docs: https://vercel.com/docs
- Whop Docs: https://docs.whop.com
- Pusher Docs: https://pusher.com/docs
- Open an issue on GitHub


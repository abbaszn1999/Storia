import { CreditCard, Zap, TrendingUp, Download, Check, Star } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

export default function Subscription() {
  const subscription = {
    plan: "Pro",
    status: "active",
    billingCycle: "monthly",
    amount: 49,
    nextBillingDate: "Feb 5, 2025",
    credits: {
      current: 750,
      total: 1000,
      used: 250,
    },
  };

  const plans = [
    {
      name: "Starter",
      price: 19,
      credits: 300,
      features: [
        "300 credits per month",
        "720p video quality",
        "Basic templates",
        "Email support",
        "1 workspace",
      ],
      current: false,
    },
    {
      name: "Pro",
      price: 49,
      credits: 1000,
      features: [
        "1,000 credits per month",
        "4K video quality",
        "All templates",
        "Priority support",
        "5 workspaces",
        "API access",
      ],
      current: true,
      popular: true,
    },
    {
      name: "Enterprise",
      price: 199,
      credits: 5000,
      features: [
        "5,000 credits per month",
        "4K video quality",
        "Custom templates",
        "Dedicated support",
        "Unlimited workspaces",
        "API access",
        "Custom integrations",
        "Advanced analytics",
      ],
      current: false,
    },
  ];

  const billingHistory = [
    { id: "1", date: "Jan 5, 2025", amount: 49, status: "Paid", invoice: "INV-2025-001" },
    { id: "2", date: "Dec 5, 2024", amount: 49, status: "Paid", invoice: "INV-2024-012" },
    { id: "3", date: "Nov 5, 2024", amount: 49, status: "Paid", invoice: "INV-2024-011" },
    { id: "4", date: "Oct 5, 2024", amount: 49, status: "Paid", invoice: "INV-2024-010" },
  ];

  const usageBreakdown = [
    { category: "Video Generation", credits: 120, percentage: 48 },
    { category: "Image Generation", credits: 80, percentage: 32 },
    { category: "Voice Synthesis", credits: 30, percentage: 12 },
    { category: "Text Generation", credits: 20, percentage: 8 },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Subscription</h1>
        <p className="text-muted-foreground">
          Manage your subscription, credits, and billing
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subscription.plan}</div>
            <p className="text-xs text-muted-foreground mt-1">
              ${subscription.amount}/month
            </p>
            <Badge variant="secondary" className="mt-3">
              {subscription.status}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credits Remaining</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {subscription.credits.current.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              of {subscription.credits.total.toLocaleString()} credits
            </p>
            <Progress value={(subscription.credits.current / subscription.credits.total) * 100} className="mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Billing</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${subscription.amount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              on {subscription.nextBillingDate}
            </p>
            <Button variant="outline" size="sm" className="mt-3 w-full" data-testid="button-update-payment">
              Update Payment
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Credit Usage</CardTitle>
          <CardDescription>
            {subscription.credits.used} credits used this month
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {usageBreakdown.map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{item.category}</span>
                <span className="font-medium">{item.credits} credits</span>
              </div>
              <Progress value={item.percentage} />
            </div>
          ))}
        </CardContent>
      </Card>

      <div>
        <h2 className="text-2xl font-bold mb-4">Available Plans</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={plan.current ? "border-primary" : ""}
              data-testid={`plan-card-${plan.name.toLowerCase()}`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {plan.name}
                      {plan.popular && (
                        <Badge className="bg-gradient-to-r from-primary to-accent">
                          <Star className="h-3 w-3 mr-1" />
                          Popular
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {plan.credits.toLocaleString()} credits/month
                    </CardDescription>
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  variant={plan.current ? "secondary" : "default"}
                  className="w-full"
                  disabled={plan.current}
                  data-testid={`button-${plan.name.toLowerCase()}-plan`}
                >
                  {plan.current ? "Current Plan" : "Upgrade"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>View and download your invoices</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {billingHistory.map((item, index) => (
              <div key={item.id}>
                {index > 0 && <Separator className="my-4" />}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{item.invoice}</p>
                      <p className="text-sm text-muted-foreground">{item.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-medium">${item.amount}</p>
                      <Badge variant="secondary" className="text-xs">
                        {item.status}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      data-testid={`button-download-invoice-${item.id}`}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle>Cancel Subscription</CardTitle>
          <CardDescription>
            You will lose access to Pro features at the end of your billing period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" data-testid="button-cancel-subscription">
            Cancel Subscription
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

import { Camera, Zap, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const features = [
  {
    name: 'Snap & Scan',
    description: 'Just take a picture of your receipt. Our advanced OCR instantly digitizes every item, price, and tax.',
    icon: Camera,
  },
  {
    name: 'Smart Itemization',
    description: 'We automatically group items and map them out so you don\'t have to type anything manually.',
    icon: Zap,
  },
  {
    name: 'Tap to Assign',
    description: 'Add your friends to the check and simply tap items to assign them. We do all the math, including tax and tip.',
    icon: Users,
  },
];

export function Features() {
  return (
    <section id="features" className="py-20 bg-muted/50 border-y">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-foreground">
            How Check Split Works
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Say goodbye to complex math and awkward conversations. We handle the hard part so you can focus on the fun part.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <Card key={index} className="border-none shadow-md bg-background/60 backdrop-blur-sm transition-all hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-primary/5">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary">
                  <feature.icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl">{feature.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

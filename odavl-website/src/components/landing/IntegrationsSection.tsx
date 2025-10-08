'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { 
  GitBranch, 
  Code2, 
  Webhook, 
  Shield, 
  Database,
  MessageSquare,
  Settings,
  CheckCircle2,
  ArrowRight,
  Zap
} from 'lucide-react';

const getStatusStyle = (status: string) => {
  if (status === 'Native') return 'bg-electric-cyan/20 text-electric-cyan';
  if (status === 'Ready') return 'bg-green-500/20 text-green-400';
  return 'bg-yellow-500/20 text-yellow-400';
};

const IntegrationCard = ({ 
  category, 
  title, 
  description, 
  integrations, 
  icon: Icon,
  delay = 0 
}: {
  category: string;
  title: string;
  description: string;
  integrations: Array<{ name: string; status: string }>;
  icon: React.ComponentType<{ className?: string }>;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay }}
    viewport={{ once: true }}
    className="relative group"
  >
    <div className="relative h-full p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 
                    hover:bg-white/8 hover:border-electric-cyan/30 transition-all duration-300
                    hover:shadow-[0_0_30px_rgba(0,212,255,0.15)]">
      
      {/* Icon */}
      <div className="relative mb-6">
        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-odavl-navy/20 to-electric-cyan/20 
                        flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
          <Icon className="w-8 h-8 text-electric-cyan" />
        </div>
        <div className="absolute inset-0 w-16 h-16 rounded-xl bg-electric-cyan/20 blur-xl opacity-0 
                        group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      <div className="text-electric-cyan text-sm font-medium mb-2">{category}</div>
      <h3 className="text-xl font-semibold text-white mb-4 group-hover:text-electric-cyan transition-colors duration-300">
        {title}
      </h3>
      
      <p className="text-slate-300 mb-6 leading-relaxed">
        {description}
      </p>

      <div className="space-y-3">
        {integrations.map((integration, index) => (
          <motion.div
            key={`${title}-integration-${index}`}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: delay + 0.1 + (index * 0.1) }}
            viewport={{ once: true }}
            className="flex items-center justify-between text-sm"
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-electric-cyan flex-shrink-0" />
              <span className="text-slate-300">{integration.name}</span>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusStyle(integration.status)}`}>
              {integration.status}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Hover effect gradient */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-electric-cyan/5 to-transparent 
                      opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </div>
  </motion.div>
);

const WorkflowStep = ({ 
  step, 
  title, 
  description, 
  delay = 0 
}: {
  step: string;
  title: string;
  description: string;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay }}
    viewport={{ once: true }}
    className="relative text-center"
  >
    <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-br from-electric-cyan/20 to-odavl-navy/40 
                    border border-electric-cyan/30 flex items-center justify-center text-electric-cyan font-bold">
      {step}
    </div>
    <h4 className="text-lg font-semibold text-white mb-2">{title}</h4>
    <p className="text-slate-300 text-sm leading-relaxed">{description}</p>
  </motion.div>
);

export default function IntegrationsSection() {
  const t = useTranslations('integrations');

  const integrationCategories = [
    {
      category: t('development.category'),
      title: t('development.title'),
      description: t('development.description'),
      icon: Code2,
      integrations: [
        { name: "Visual Studio Code", status: t('status.native') },
        { name: "IntelliJ IDEA", status: t('status.ready') },
        { name: "WebStorm", status: t('status.ready') },
        { name: "Sublime Text", status: t('status.planned') },
        { name: "Vim/Neovim", status: t('status.ready') }
      ]
    },
    {
      category: t('versionControl.category'),
      title: t('versionControl.title'),
      description: t('versionControl.description'),
      icon: GitBranch,
      integrations: [
        { name: "GitHub", status: t('status.native') },
        { name: "GitLab", status: t('status.native') },
        { name: "Bitbucket", status: t('status.ready') },
        { name: "Azure DevOps", status: t('status.ready') },
        { name: "Gitea", status: t('status.planned') }
      ]
    },
    {
      category: t('cicd.category'),
      title: t('cicd.title'),
      description: t('cicd.description'),
      icon: Webhook,
      integrations: [
        { name: "GitHub Actions", status: t('status.native') },
        { name: "GitLab CI/CD", status: t('status.native') },
        { name: "Jenkins", status: t('status.ready') },
        { name: "Azure Pipelines", status: t('status.ready') },
        { name: "CircleCI", status: t('status.ready') }
      ]
    },
    {
      category: t('security.category'),
      title: t('security.title'),
      description: t('security.description'),
      icon: Shield,
      integrations: [
        { name: "SonarQube", status: t('status.native') },
        { name: "Snyk", status: t('status.ready') },
        { name: "CodeQL", status: t('status.ready') },
        { name: "Checkmarx", status: t('status.planned') },
        { name: "Veracode", status: t('status.planned') }
      ]
    },
    {
      category: t('monitoring.category'),
      title: t('monitoring.title'),
      description: t('monitoring.description'),
      icon: Database,
      integrations: [
        { name: "Datadog", status: t('status.ready') },
        { name: "New Relic", status: t('status.ready') },
        { name: "Splunk", status: t('status.planned') },
        { name: "Elasticsearch", status: t('status.ready') },
        { name: "Prometheus", status: t('status.ready') }
      ]
    },
    {
      category: t('communication.category'),
      title: t('communication.title'),
      description: t('communication.description'),
      icon: MessageSquare,
      integrations: [
        { name: "Slack", status: t('status.native') },
        { name: "Microsoft Teams", status: t('status.native') },
        { name: "Discord", status: t('status.ready') },
        { name: "Webhook", status: t('status.native') },
        { name: "Email", status: t('status.native') }
      ]
    }
  ];

  const workflowSteps = [
    {
      step: "1",
      title: t('workflow.install.title'),
      description: t('workflow.install.description')
    },
    {
      step: "2",
      title: t('workflow.configure.title'),
      description: t('workflow.configure.description')
    },
    {
      step: "3",
      title: t('workflow.automate.title'),
      description: t('workflow.automate.description')
    },
    {
      step: "4",
      title: t('workflow.monitor.title'),
      description: t('workflow.monitor.description')
    }
  ];

  return (
    <section className="relative py-32 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-odavl-navy" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,212,255,0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(15,52,96,0.3),transparent_50%)]" />
      
      {/* Animated Grid */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,212,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,212,255,0.1)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      <div className="container mx-auto px-6 relative">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full 
                       bg-gradient-to-r from-electric-cyan/20 to-transparent 
                       border border-electric-cyan/30 mb-6"
          >
            <Settings className="w-4 h-4 text-electric-cyan" />
            <span className="text-sm font-medium text-electric-cyan">
              {t('badge')}
            </span>
          </motion.div>

          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
            {t('title.main')} <br />
            <span className="bg-gradient-to-r from-electric-cyan via-blue-400 to-electric-cyan bg-clip-text text-transparent">
              {t('title.highlight')}
            </span>
          </h2>
          
          <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            {t('subtitle')}
          </p>
        </motion.div>

        {/* Integration Categories */}
        <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-8 mb-20">
          {integrationCategories.map((category, index) => (
            <IntegrationCard
              key={`integration-${category.category}`}
              {...category}
              delay={0.1 * index}
            />
          ))}
        </div>

        {/* Workflow Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <h3 className="text-3xl font-bold text-center text-white mb-4">
            {t('workflow.title')}
          </h3>
          <p className="text-slate-300 text-center max-w-2xl mx-auto mb-16">
            {t('workflow.subtitle')}
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {workflowSteps.map((step, index) => (
              <WorkflowStep
                key={`workflow-${step.step}`}
                {...step}
                delay={0.2 * index}
              />
            ))}
          </div>
        </motion.div>

        {/* Enterprise Support */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          viewport={{ once: true }}
          className="relative p-8 rounded-2xl bg-gradient-to-br from-odavl-navy/30 to-electric-cyan/10 
                     border border-electric-cyan/20 mb-20"
        >
          <div className="text-center">
            <Zap className="w-12 h-12 text-electric-cyan mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-4">
              {t('enterprise.title')}
            </h3>
            <p className="text-slate-300 max-w-2xl mx-auto mb-6">
              {t('enterprise.description')}
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-slate-300">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-electric-cyan" />
                {t('enterprise.features.custom')}
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-electric-cyan" />
                {t('enterprise.features.priority')}
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-electric-cyan" />
                {t('enterprise.features.support')}
              </span>
            </div>
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <div className="relative inline-block">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="group relative px-8 py-4 rounded-xl bg-gradient-to-r from-electric-cyan to-blue-500 
                         text-white font-semibold text-lg shadow-[0_0_30px_rgba(0,212,255,0.3)]
                         hover:shadow-[0_0_50px_rgba(0,212,255,0.5)] transition-all duration-300"
            >
              <span className="relative z-10 flex items-center gap-2">
                {t('cta.main')}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </span>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-electric-cyan/20 to-blue-500/20 
                              blur-xl group-hover:scale-110 transition-transform duration-300" />
            </motion.button>
          </div>
          
          <p className="text-slate-400 text-sm mt-4">
            {t('cta.subtitle')}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
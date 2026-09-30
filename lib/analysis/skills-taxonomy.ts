export type SkillCategory =
  | "Languages"
  | "Frontend"
  | "Backend"
  | "Databases"
  | "Cloud & DevOps"
  | "Data & AI"
  | "Mobile"
  | "Testing & QA"
  | "Tools"
  | "Design"
  | "Security"
  | "Engineering Practices"
  | "Business"
  | "Marketing"
  | "Finance"
  | "Healthcare"
  | "Methodologies"
  | "Certifications"
  | "Soft Skills";

export interface SkillDefinition {
  name: string;
  category: SkillCategory;
  /** Extra spellings matched case-insensitively (unless `caseSensitive`). */
  aliases?: string[];
  /** Match the name/aliases case-sensitively (for short or ambiguous words). */
  caseSensitive?: boolean;
  /** Skip matching the bare name (only aliases/patterns are used). */
  skipName?: boolean;
  /** Fully custom patterns for terms that need contextual matching. */
  patterns?: RegExp[];
  /** Family of interchangeable technologies, used to explain near-misses. */
  group?: string;
  /** Skills this one strongly implies (e.g. Next.js implies React). */
  implies?: string[];
}

type Options = Omit<SkillDefinition, "name" | "category">;

const define =
  (category: SkillCategory) =>
  (name: string, options: Options = {}): SkillDefinition => ({ name, category, ...options });

const lang = define("Languages");
const fe = define("Frontend");
const be = define("Backend");
const db = define("Databases");
const ops = define("Cloud & DevOps");
const data = define("Data & AI");
const mobile = define("Mobile");
const qa = define("Testing & QA");
const tool = define("Tools");
const design = define("Design");
const sec = define("Security");
const eng = define("Engineering Practices");
const biz = define("Business");
const mkt = define("Marketing");
const fin = define("Finance");
const health = define("Healthcare");
const method = define("Methodologies");
const cert = define("Certifications");
const soft = define("Soft Skills");

const LIST_CONTEXT = String.raw`(?=\s*(?:,|/|\)|;|\||and\b|or\b|programming|language|developer|engineer|$))`;

export const SKILLS: SkillDefinition[] = [
  // Languages
  lang("JavaScript", { aliases: ["ES6", "ECMAScript", "Java Script"], patterns: [/(?<![A-Za-z0-9])JS(?![A-Za-z0-9])/] }),
  lang("TypeScript"),
  lang("Python"),
  lang("Java"),
  lang("C#", { aliases: ["C Sharp", "CSharp"] }),
  lang("C++", { aliases: ["CPP"] }),
  lang("C", { skipName: true, patterns: [new RegExp(String.raw`(?<![A-Za-z0-9+#./-])C(?![A-Za-z0-9+#.'&-])` + LIST_CONTEXT, "m")] }),
  lang("Go", {
    skipName: true,
    aliases: ["Golang"],
    patterns: [new RegExp(String.raw`(?<![A-Za-z0-9+#./-])Go(?![A-Za-z0-9+#'-])` + LIST_CONTEXT, "m")],
  }),
  lang("Rust", { caseSensitive: true }),
  lang("Ruby", { caseSensitive: true }),
  lang("PHP"),
  lang("Swift", { caseSensitive: true }),
  lang("Kotlin"),
  lang("Scala", { caseSensitive: true }),
  lang("R", {
    skipName: true,
    aliases: ["RStudio", "R programming", "R language"],
    patterns: [new RegExp(String.raw`(?<![A-Za-z0-9&.'/-])R(?![A-Za-z0-9&.'+#-])` + LIST_CONTEXT, "m")],
  }),
  lang("MATLAB"),
  lang("Perl", { caseSensitive: true }),
  lang("Dart", { caseSensitive: true }),
  lang("Elixir"),
  lang("Haskell"),
  lang("Lua", { caseSensitive: true }),
  lang("Objective-C", { aliases: ["ObjC"] }),
  lang("Bash", { aliases: ["Shell Scripting", "Shell Script", "Zsh", "Bash Scripting"] }),
  lang("PowerShell"),
  lang("SQL", { aliases: ["T-SQL", "PL/SQL", "TSQL"] }),
  lang("HTML", { aliases: ["HTML5"] }),
  lang("CSS", { aliases: ["CSS3"] }),
  lang("Solidity"),
  lang("VBA"),
  lang("Groovy", { caseSensitive: true }),
  lang("Julia", { caseSensitive: true }),
  lang("COBOL"),
  lang("Clojure"),

  // Frontend
  fe("React", { aliases: ["React.js", "ReactJS", "React JS"], group: "frontend-framework" }),
  fe("Next.js", { aliases: ["NextJS", "Next JS"], implies: ["React"], group: "react-meta" }),
  fe("Vue.js", { aliases: ["Vue", "VueJS", "Vue 3"], group: "frontend-framework" }),
  fe("Nuxt", { aliases: ["Nuxt.js", "NuxtJS"], implies: ["Vue.js"], group: "react-meta" }),
  fe("Angular", { aliases: ["AngularJS", "Angular.js"], group: "frontend-framework" }),
  fe("Svelte", { aliases: ["SvelteKit"], group: "frontend-framework" }),
  fe("Remix", { caseSensitive: true, group: "react-meta", implies: ["React"] }),
  fe("Gatsby", { caseSensitive: true, group: "react-meta", implies: ["React"] }),
  fe("Astro", { caseSensitive: true, group: "react-meta" }),
  fe("Ember.js", { aliases: ["EmberJS"], group: "frontend-framework" }),
  fe("Redux", { aliases: ["Redux Toolkit", "RTK"], group: "state-management" }),
  fe("Zustand", { group: "state-management" }),
  fe("MobX", { group: "state-management" }),
  fe("RxJS"),
  fe("jQuery"),
  fe("Tailwind CSS", { aliases: ["Tailwind", "TailwindCSS"], group: "css-framework" }),
  fe("Bootstrap", { caseSensitive: true, group: "css-framework" }),
  fe("Sass", { aliases: ["SCSS"] }),
  fe("Material UI", { aliases: ["MUI", "Material-UI"], group: "component-library" }),
  fe("Chakra UI", { group: "component-library" }),
  fe("shadcn/ui", { aliases: ["shadcn"], group: "component-library" }),
  fe("Styled Components", { aliases: ["styled-components", "Emotion"] }),
  fe("Webpack", { group: "bundler" }),
  fe("Vite", { caseSensitive: true, group: "bundler" }),
  fe("Babel", { caseSensitive: true }),
  fe("Storybook"),
  fe("Three.js", { aliases: ["ThreeJS", "WebGL"] }),
  fe("D3.js", { aliases: ["D3"] }),
  fe("Framer Motion"),
  fe("Responsive Design", { aliases: ["Responsive Web Design", "Mobile-First", "Mobile First Design"] }),
  fe("Web Accessibility", { aliases: ["Accessibility", "WCAG", "a11y", "ARIA"] }),
  fe("Micro-frontends", { aliases: ["Microfrontends", "Micro frontends"] }),
  fe("Server-Side Rendering", { aliases: ["SSR"] }),
  fe("Web Performance", { aliases: ["Core Web Vitals", "Lighthouse"] }),

  // Backend
  be("Node.js", { aliases: ["NodeJS", "Node JS", "Node"], group: "backend-runtime" }),
  be("Express", { caseSensitive: true, aliases: ["Express.js", "ExpressJS"], implies: ["Node.js"], group: "node-framework" }),
  be("NestJS", { aliases: ["Nest.js"], implies: ["Node.js"], group: "node-framework" }),
  be("Fastify", { implies: ["Node.js"], group: "node-framework" }),
  be("Deno", { caseSensitive: true, group: "backend-runtime" }),
  be("Django", { implies: ["Python"], group: "python-framework" }),
  be("Flask", { caseSensitive: true, implies: ["Python"], group: "python-framework" }),
  be("FastAPI", { implies: ["Python"], group: "python-framework" }),
  be("Spring Boot", { implies: ["Spring", "Java"], group: "jvm-framework" }),
  be("Spring", {
    skipName: true,
    aliases: ["Spring Framework", "Spring MVC"],
    patterns: [/(?<![A-Za-z])Spring(?! (?:19|20)\d\d)(?! (?:semester|term|break|internship|quarter|session))(?![A-Za-z])/],
    implies: ["Java"],
    group: "jvm-framework",
  }),
  be("Hibernate", { implies: ["Java"] }),
  be(".NET", { aliases: [".NET Core", "dotnet", ".NET Framework"], group: "dotnet" }),
  be("ASP.NET", { aliases: ["ASP.NET Core", "ASP.NET MVC"], implies: [".NET"], group: "dotnet" }),
  be("Ruby on Rails", { aliases: ["Rails", "RoR"], implies: ["Ruby"] }),
  be("Laravel", { implies: ["PHP"] }),
  be("Symfony", { implies: ["PHP"] }),
  be("GraphQL", { aliases: ["Apollo GraphQL", "Apollo"], group: "api-style" }),
  be("REST APIs", {
    aliases: ["REST API", "RESTful", "RESTful API", "RESTful APIs", "RESTful services", "RESTful web services"],
    patterns: [/(?<![A-Za-z])REST(?![A-Za-z])/],
    group: "api-style",
  }),
  be("gRPC", { group: "api-style" }),
  be("tRPC", { group: "api-style" }),
  be("Microservices", { aliases: ["Microservice", "Micro-services", "Microservices Architecture"] }),
  be("WebSockets", { aliases: ["WebSocket", "Socket.io", "Socket.IO"] }),
  be("Kafka", { aliases: ["Apache Kafka"], group: "message-broker" }),
  be("RabbitMQ", { group: "message-broker" }),
  be("Amazon SQS", { aliases: ["SQS"], group: "message-broker" }),
  be("Redis", { group: "cache" }),
  be("Memcached", { group: "cache" }),
  be("Celery", { caseSensitive: true }),
  be("Serverless", { aliases: ["Serverless Framework"] }),
  be("API Design", { aliases: ["API Development", "API Architecture"] }),
  be("OAuth", { aliases: ["OAuth2", "OAuth 2.0", "OpenID Connect", "OIDC"] }),
  be("JWT", { aliases: ["JSON Web Tokens", "JSON Web Token"] }),
  be("Nginx"),
  be("Event-Driven Architecture", { aliases: ["Event Driven Architecture", "Event-Driven", "Event Sourcing"] }),
  be("System Design", { aliases: ["Systems Design", "Software Architecture"] }),
  be("Distributed Systems"),
  be("Prisma", { caseSensitive: true, group: "orm" }),
  be("Sequelize", { group: "orm" }),
  be("TypeORM", { group: "orm" }),
  be("Drizzle", { caseSensitive: true, aliases: ["Drizzle ORM"], group: "orm" }),

  // Databases
  db("PostgreSQL", { aliases: ["Postgres", "Postgre SQL"], group: "sql-db" }),
  db("MySQL", { group: "sql-db" }),
  db("SQL Server", { aliases: ["MSSQL", "Microsoft SQL Server", "MS SQL"], group: "sql-db" }),
  db("Oracle Database", { aliases: ["Oracle DB", "Oracle SQL"], patterns: [/(?<![A-Za-z])Oracle(?![A-Za-z])/], group: "sql-db" }),
  db("SQLite", { group: "sql-db" }),
  db("MariaDB", { group: "sql-db" }),
  db("MongoDB", { aliases: ["Mongo", "Mongoose"], group: "nosql-db" }),
  db("DynamoDB", { aliases: ["Dynamo DB"], group: "nosql-db" }),
  db("Cassandra", { aliases: ["Apache Cassandra"], group: "nosql-db" }),
  db("Firebase", { aliases: ["Firestore"], group: "nosql-db" }),
  db("Supabase", { group: "sql-db" }),
  db("Elasticsearch", { aliases: ["Elastic Search", "OpenSearch"] }),
  db("Neo4j"),
  db("Snowflake", { group: "warehouse" }),
  db("BigQuery", { aliases: ["Big Query"], group: "warehouse" }),
  db("Redshift", { aliases: ["Amazon Redshift"], group: "warehouse" }),
  db("NoSQL"),
  db("Data Modeling", { aliases: ["Data Modelling", "Database Design", "Schema Design"] }),

  // Cloud & DevOps
  ops("AWS", { aliases: ["Amazon Web Services"], group: "cloud" }),
  ops("Azure", { aliases: ["Microsoft Azure"], group: "cloud" }),
  ops("Google Cloud", { aliases: ["GCP", "Google Cloud Platform"], group: "cloud" }),
  ops("Docker", { aliases: ["Dockerfile", "Docker Compose"], group: "containers" }),
  ops("Kubernetes", { aliases: ["K8s"], group: "orchestration" }),
  ops("Amazon EKS", { aliases: ["EKS"], implies: ["Kubernetes", "AWS"], group: "orchestration" }),
  ops("Amazon ECS", { aliases: ["ECS"], implies: ["AWS"], group: "orchestration" }),
  ops("OpenShift", { group: "orchestration" }),
  ops("Helm", { caseSensitive: true }),
  ops("Terraform", { group: "iac" }),
  ops("CloudFormation", { aliases: ["AWS CloudFormation"], group: "iac" }),
  ops("Pulumi", { group: "iac" }),
  ops("Ansible", { group: "config-management" }),
  ops("Infrastructure as Code", { aliases: ["IaC"] }),
  ops("Jenkins", { group: "ci", implies: ["CI/CD"] }),
  ops("GitHub Actions", { group: "ci", implies: ["CI/CD"] }),
  ops("GitLab CI", { aliases: ["GitLab CI/CD"], group: "ci", implies: ["CI/CD"] }),
  ops("CircleCI", { aliases: ["Circle CI"], group: "ci", implies: ["CI/CD"] }),
  ops("Azure DevOps", { group: "ci", implies: ["CI/CD"] }),
  ops("Argo CD", { aliases: ["ArgoCD"], group: "ci", implies: ["CI/CD"] }),
  ops("CI/CD", {
    aliases: ["CI / CD", "CICD", "Continuous Integration", "Continuous Delivery", "Continuous Deployment"],
  }),
  ops("DevOps"),
  ops("Site Reliability Engineering", { aliases: ["SRE"] }),
  ops("Linux", { aliases: ["Ubuntu", "CentOS", "RHEL", "Red Hat"] }),
  ops("Unix"),
  ops("AWS Lambda", { patterns: [/(?<![A-Za-z])Lambda(?![A-Za-z])/], implies: ["AWS"], group: "serverless" }),
  ops("Amazon EC2", { aliases: ["EC2"], implies: ["AWS"] }),
  ops("Amazon S3", { skipName: true, patterns: [/(?<![A-Za-z0-9])S3(?![A-Za-z0-9])/, /Amazon S3/i], implies: ["AWS"] }),
  ops("Heroku", { group: "paas" }),
  ops("Vercel", { group: "paas" }),
  ops("Netlify", { group: "paas" }),
  ops("Cloudflare"),
  ops("Prometheus", { group: "monitoring" }),
  ops("Grafana", { group: "monitoring" }),
  ops("Datadog", { aliases: ["Data Dog"], group: "monitoring" }),
  ops("New Relic", { group: "monitoring" }),
  ops("Splunk", { group: "monitoring" }),
  ops("ELK Stack", { aliases: ["ELK", "Kibana", "Logstash"], group: "monitoring" }),
  ops("Observability", { aliases: ["OpenTelemetry"] }),

  // Data & AI
  data("Machine Learning", { patterns: [/(?<![A-Za-z0-9])ML(?![A-Za-z0-9])/] }),
  data("Deep Learning", { aliases: ["Neural Networks", "Neural Network"] }),
  data("Artificial Intelligence", { patterns: [/(?<![A-Za-z0-9])AI(?![A-Za-z0-9])/] }),
  data("NLP", { aliases: ["Natural Language Processing"] }),
  data("Computer Vision", { aliases: ["OpenCV"] }),
  data("LLMs", { aliases: ["LLM", "Large Language Models", "Large Language Model"] }),
  data("Generative AI", { aliases: ["GenAI", "Gen AI"] }),
  data("Prompt Engineering"),
  data("RAG", { caseSensitive: true, aliases: ["Retrieval-Augmented Generation", "Retrieval Augmented Generation"] }),
  data("LangChain", { aliases: ["LlamaIndex"] }),
  data("OpenAI API", { aliases: ["OpenAI"] }),
  data("Hugging Face", { aliases: ["HuggingFace", "Transformers"] }),
  data("TensorFlow", { group: "ml-framework" }),
  data("PyTorch", { group: "ml-framework" }),
  data("Keras", { group: "ml-framework" }),
  data("scikit-learn", { aliases: ["sklearn", "scikit learn"], group: "ml-framework" }),
  data("Pandas", { implies: ["Python"] }),
  data("NumPy", { implies: ["Python"] }),
  data("Matplotlib", { aliases: ["Seaborn", "Plotly"] }),
  data("Jupyter", { aliases: ["Jupyter Notebook", "Jupyter Notebooks"] }),
  data("Apache Spark", { aliases: ["Spark", "PySpark"], group: "big-data" }),
  data("Hadoop", { aliases: ["HDFS", "Hive"], group: "big-data" }),
  data("Databricks", { group: "big-data" }),
  data("Airflow", { aliases: ["Apache Airflow"], group: "orchestration-data" }),
  data("dbt", { caseSensitive: true }),
  data("ETL", { aliases: ["ELT", "ETL Pipelines", "Data Pipelines", "Data Pipeline"] }),
  data("Data Engineering"),
  data("Data Warehousing", { aliases: ["Data Warehouse", "Data Warehouses"] }),
  data("Big Data"),
  data("MLOps", { aliases: ["ML Ops", "MLflow"] }),
  data("Data Analysis", { aliases: ["Data Analytics", "Data Analyst", "Analyzing Data"] }),
  data("Data Visualization", { aliases: ["Data Visualisation", "Dashboards", "Dashboarding"] }),
  data("Tableau", { group: "bi" }),
  data("Power BI", { aliases: ["PowerBI"], group: "bi" }),
  data("Looker", { aliases: ["Looker Studio", "Google Data Studio"], group: "bi" }),
  data("Microsoft Excel", {
    skipName: true,
    aliases: ["MS Excel", "Microsoft Excel", "Excel Spreadsheets"],
    patterns: [/(?<![A-Za-z])Excel(?! at\b)(?! in\b)(?![A-Za-z])/],
  }),
  data("Statistics", { aliases: ["Statistical Analysis", "Statistical Modeling"] }),
  data("A/B Testing", { aliases: ["AB Testing", "Split Testing", "Experimentation"] }),
  data("Predictive Modeling", { aliases: ["Predictive Analytics", "Forecasting Models"] }),

  // Mobile
  mobile("React Native", { group: "mobile-cross" }),
  mobile("Flutter", { implies: ["Dart"], group: "mobile-cross" }),
  mobile("iOS", { group: "mobile-native" }),
  mobile("Android", { group: "mobile-native" }),
  mobile("SwiftUI", { implies: ["Swift"] }),
  mobile("Jetpack Compose", { implies: ["Kotlin"] }),
  mobile("Xamarin", { group: "mobile-cross" }),
  mobile("Ionic", { caseSensitive: true, group: "mobile-cross" }),
  mobile("Expo", { caseSensitive: true, implies: ["React Native"] }),

  // Testing & QA
  qa("Jest", { caseSensitive: true, group: "unit-test" }),
  qa("Vitest", { group: "unit-test" }),
  qa("Mocha", { caseSensitive: true, aliases: ["Chai"], group: "unit-test" }),
  qa("JUnit", { group: "unit-test" }),
  qa("pytest", { aliases: ["PyTest"], group: "unit-test" }),
  qa("React Testing Library", { aliases: ["Testing Library", "RTL"] }),
  qa("Cypress", { group: "e2e-test" }),
  qa("Playwright", { group: "e2e-test" }),
  qa("Selenium", { aliases: ["WebDriver"], group: "e2e-test" }),
  qa("Appium", { group: "e2e-test" }),
  qa("Postman", { caseSensitive: true }),
  qa("JMeter", { aliases: ["Load Testing", "k6"] }),
  qa("Unit Testing", { aliases: ["Unit Tests", "Unit Test"] }),
  qa("Integration Testing", { aliases: ["Integration Tests"] }),
  qa("End-to-End Testing", { aliases: ["E2E Testing", "E2E Tests", "End to End Testing", "E2E"] }),
  qa("Test Automation", { aliases: ["Automated Testing", "Automation Testing", "Automated Tests"] }),
  qa("TDD", { aliases: ["Test-Driven Development", "Test Driven Development"] }),
  qa("Quality Assurance", { aliases: ["QA"] }),
  qa("Manual Testing"),

  // Tools
  tool("Git", { caseSensitive: true, aliases: ["git"] }),
  tool("GitHub", { group: "vcs-host", implies: ["Git"] }),
  tool("GitLab", { group: "vcs-host", implies: ["Git"] }),
  tool("Bitbucket", { group: "vcs-host", implies: ["Git"] }),
  tool("Jira", { group: "pm-tool" }),
  tool("Confluence", { caseSensitive: true }),
  tool("Trello", { group: "pm-tool" }),
  tool("Asana", { group: "pm-tool" }),
  tool("Notion", { caseSensitive: true, group: "pm-tool" }),
  tool("Salesforce", { aliases: ["SFDC"], group: "crm-tool" }),
  tool("HubSpot", { group: "crm-tool" }),
  tool("Zendesk"),
  tool("ServiceNow"),
  tool("SAP", { caseSensitive: true }),
  tool("Microsoft Office", { aliases: ["MS Office", "Office 365", "Microsoft 365", "M365"] }),
  tool("Google Workspace", { aliases: ["G Suite", "GSuite"] }),
  tool("PowerPoint", { aliases: ["Power Point", "Keynote"] }),
  tool("SharePoint"),
  tool("Visio", { caseSensitive: true }),

  // Design
  design("Figma", { group: "design-tool" }),
  design("Sketch", { caseSensitive: true, group: "design-tool" }),
  design("Adobe XD", { group: "design-tool" }),
  design("Adobe Photoshop", { aliases: ["Photoshop"] }),
  design("Adobe Illustrator", { patterns: [/(?<![A-Za-z])Illustrator(?![A-Za-z])/] }),
  design("Adobe InDesign", { aliases: ["InDesign"] }),
  design("Adobe Creative Suite", { aliases: ["Adobe Creative Cloud", "Creative Cloud"] }),
  design("After Effects", { aliases: ["Adobe After Effects"] }),
  design("Premiere Pro", { aliases: ["Adobe Premiere"] }),
  design("Canva", { caseSensitive: true }),
  design("UI Design", { aliases: ["User Interface Design", "UI/UX", "UI UX"] }),
  design("UX Design", { aliases: ["User Experience", "UX", "UX/UI"] }),
  design("User Research", { aliases: ["UX Research", "User Interviews"] }),
  design("Wireframing", { aliases: ["Wireframes", "Wireframe"] }),
  design("Prototyping", { aliases: ["Prototypes", "Prototype"] }),
  design("Design Systems", { aliases: ["Design System", "Component Library"] }),
  design("Usability Testing"),
  design("Interaction Design"),

  // Security
  sec("Cybersecurity", { aliases: ["Cyber Security", "Information Security", "InfoSec"] }),
  sec("Penetration Testing", { aliases: ["Pen Testing", "Pentesting", "Ethical Hacking"] }),
  sec("OWASP"),
  sec("SIEM"),
  sec("IAM", { caseSensitive: true, aliases: ["Identity and Access Management"] }),
  sec("Network Security"),
  sec("Encryption", { aliases: ["Cryptography", "TLS", "SSL"] }),
  sec("SOC 2", { aliases: ["SOC2"] }),
  sec("ISO 27001"),
  sec("Vulnerability Management", { aliases: ["Vulnerability Assessment", "Vulnerability Scanning"] }),
  sec("Incident Response"),
  sec("Firewalls", { aliases: ["Firewall"] }),

  // Engineering practices
  eng("Data Structures"),
  eng("Algorithms", { aliases: ["Algorithm Design"] }),
  eng("Object-Oriented Programming", { aliases: ["OOP", "Object Oriented Programming", "Object-Oriented Design", "OOD"] }),
  eng("Functional Programming"),
  eng("Design Patterns"),
  eng("Performance Optimization", { aliases: ["Performance Tuning", "Performance Optimisation"] }),
  eng("Caching"),
  eng("Scalability", { aliases: ["Scalable Systems", "Scalable Applications", "Scalable"] }),
  eng("Code Review", {
    aliases: ["Code Reviews", "Peer Reviews", "Pull Request Reviews", "Reviewing Pull Requests", "Reviewed Pull Requests", "PR Reviews"],
  }),
  eng("Debugging", { aliases: ["Troubleshooting"] }),
  eng("Version Control"),
  eng("API Integration", { aliases: ["Third-Party APIs", "Third-Party Integrations", "API Integrations"] }),
  eng("Multithreading", { aliases: ["Concurrency", "Multi-threading", "Parallel Programming"] }),
  eng("TCP/IP", { aliases: ["Networking Protocols", "HTTP/HTTPS"] }),
  eng("SaaS", { caseSensitive: true }),
  eng("Cloud Computing"),
  eng("Web Development", { aliases: ["Web Applications", "Web Application Development"] }),
  eng("Full-Stack Development", { aliases: ["Full Stack", "Full-Stack", "Fullstack"] }),
  eng("Technical Documentation", { aliases: ["Documentation", "Technical Writing"] }),

  // Business
  biz("Project Management", { aliases: ["Project Planning", "Program Management"] }),
  biz("Product Management", { aliases: ["Product Strategy", "Product Lifecycle"] }),
  biz("Stakeholder Management", { aliases: ["Stakeholder Communication", "Stakeholder Engagement", "Stakeholders"] }),
  biz("Business Analysis", { aliases: ["Business Analyst"] }),
  biz("Requirements Gathering", { aliases: ["Requirements Analysis", "Business Requirements", "User Stories"] }),
  biz("Product Roadmap", { aliases: ["Roadmap", "Roadmapping", "Roadmaps"] }),
  biz("Budgeting", { aliases: ["Budget Management", "Budgets"] }),
  biz("Sales", {
    skipName: true,
    aliases: ["B2B Sales", "B2C Sales", "Inside Sales", "Outside Sales", "Lead Generation", "Sales Strategy", "Sales Pipeline"],
    patterns: [/\bsales\b(?=\s+(?:experience|targets?|quotas?|cycles?|process|operations|representative|rep|executive|skills|role|development|management)\b)/i],
  }),
  biz("Account Management", { aliases: ["Key Account Management", "Client Management"] }),
  biz("Customer Success"),
  biz("CRM", { aliases: ["Customer Relationship Management"] }),
  biz("Business Development"),
  biz("Negotiation", { aliases: ["Negotiating", "Contract Negotiation"] }),
  biz("Operations Management", { aliases: ["Business Operations"] }),
  biz("Supply Chain Management", { aliases: ["Supply Chain", "Logistics", "Procurement"] }),
  biz("Process Improvement", { aliases: ["Process Optimization", "Continuous Improvement"] }),
  biz("Vendor Management", { aliases: ["Vendor Relations"] }),
  biz("Strategic Planning", { aliases: ["Strategy Development", "Business Strategy"] }),
  biz("KPIs", { aliases: ["KPI", "OKRs", "Key Performance Indicators"] }),
  biz("Six Sigma", { aliases: ["Lean Six Sigma"] }),
  biz("Change Management"),
  biz("Risk Management", { aliases: ["Risk Assessment"] }),
  biz("Customer Service", { aliases: ["Customer Support", "Client Service", "Client Support"] }),
  biz("Recruiting", { aliases: ["Recruitment", "Talent Acquisition", "Sourcing Candidates"] }),
  biz("Human Resources", { aliases: ["HR", "HRIS", "Employee Relations"] }),
  biz("Payroll"),
  biz("Compliance", { aliases: ["Regulatory Compliance"] }),
  biz("Market Research", { aliases: ["Market Analysis"] }),
  biz("Competitive Analysis", { aliases: ["Competitor Analysis"] }),
  biz("Go-to-Market Strategy", { aliases: ["Go-to-Market", "GTM"] }),
  biz("P&L Management", { aliases: ["P&L", "Profit and Loss"] }),

  // Marketing
  mkt("SEO", { aliases: ["Search Engine Optimization", "Search Engine Optimisation"] }),
  mkt("SEM", { caseSensitive: true, aliases: ["Search Engine Marketing"] }),
  mkt("PPC", { aliases: ["Pay-Per-Click", "Paid Search", "Paid Advertising", "Paid Media"] }),
  mkt("Google Ads", { aliases: ["AdWords", "Google AdWords"] }),
  mkt("Meta Ads", { aliases: ["Facebook Ads", "Facebook Advertising", "Instagram Ads"] }),
  mkt("Google Analytics", { aliases: ["GA4"] }),
  mkt("Digital Marketing", { aliases: ["Online Marketing"] }),
  mkt("Content Marketing"),
  mkt("Content Strategy", { aliases: ["Content Creation"] }),
  mkt("Social Media Marketing", { aliases: ["Social Media", "Social Media Management"] }),
  mkt("Email Marketing", { aliases: ["Email Campaigns"] }),
  mkt("Marketing Automation"),
  mkt("Mailchimp"),
  mkt("Marketo"),
  mkt("Copywriting", { aliases: ["Copy Writing"] }),
  mkt("Brand Management", { aliases: ["Branding", "Brand Strategy"] }),
  mkt("Conversion Rate Optimization", { aliases: ["CRO"] }),
  mkt("Growth Marketing", { aliases: ["Growth Hacking"] }),
  mkt("Public Relations", { aliases: ["PR Campaigns", "Media Relations"] }),

  // Finance
  fin("Financial Analysis", { aliases: ["Financial Analyst"] }),
  fin("Financial Modeling", { aliases: ["Financial Modelling", "Financial Models"] }),
  fin("Financial Reporting", { aliases: ["Financial Statements"] }),
  fin("Forecasting", { aliases: ["Financial Forecasting", "Demand Forecasting"] }),
  fin("Accounting", { aliases: ["Accountant"] }),
  fin("GAAP", { aliases: ["US GAAP"] }),
  fin("IFRS"),
  fin("Auditing", { aliases: ["Audit", "Internal Audit", "External Audit"] }),
  fin("Bookkeeping"),
  fin("Accounts Payable"),
  fin("Accounts Receivable"),
  fin("Account Reconciliation", { aliases: ["Reconciliation", "Reconciliations", "Bank Reconciliation"] }),
  fin("Taxation", { aliases: ["Tax Preparation", "Tax Compliance"] }),
  fin("Valuation", { aliases: ["DCF", "Discounted Cash Flow"] }),
  fin("QuickBooks"),
  fin("Pivot Tables", { aliases: ["PivotTables", "VLOOKUP", "XLOOKUP"] }),

  // Healthcare
  health("Patient Care"),
  health("EHR", { aliases: ["EMR", "Electronic Health Records", "Electronic Medical Records"] }),
  health("HIPAA"),
  health("BLS", { caseSensitive: true, aliases: ["Basic Life Support", "CPR"] }),
  health("Medical Terminology"),
  health("Clinical Research", { aliases: ["Clinical Trials"] }),

  // Methodologies
  method("Agile", { aliases: ["Agile Methodologies", "Agile Methodology"] }),
  method("Scrum", { caseSensitive: false }),
  method("Kanban"),
  method("Waterfall"),
  method("Lean", { skipName: true, aliases: ["Lean Methodology", "Lean Principles", "Lean Manufacturing"] }),
  method("SDLC", { aliases: ["Software Development Life Cycle", "Software Development Lifecycle"] }),
  method("ITIL"),

  // Certifications
  cert("AWS Certification", { skipName: true, patterns: [/AWS Certified[\w -]{0,40}/i, /AWS Certification/i] }),
  cert("Azure Certification", { skipName: true, patterns: [/Azure (?:Certified|Certification)/i, /\bAZ-\d{3}\b/] }),
  cert("Google Cloud Certification", { skipName: true, patterns: [/Google Cloud Certified|Professional Cloud (?:Architect|Engineer|Developer)/i] }),
  cert("CKA", { caseSensitive: true, aliases: ["Certified Kubernetes Administrator", "CKAD"] }),
  cert("PMP", { caseSensitive: true, aliases: ["Project Management Professional"] }),
  cert("Certified ScrumMaster", { aliases: ["CSM", "Certified Scrum Master", "PSM"], caseSensitive: false }),
  cert("CPA", { caseSensitive: true, aliases: ["Certified Public Accountant"] }),
  cert("CFA", { caseSensitive: true, aliases: ["Chartered Financial Analyst"] }),
  cert("CISSP", { caseSensitive: true }),
  cert("CompTIA Security+", { aliases: ["Security+", "Security Plus"] }),
  cert("CCNA", { caseSensitive: true }),

  // Soft skills
  soft("Communication", { aliases: ["Communication Skills", "Communicator", "Written and Verbal Communication", "Verbal Communication"] }),
  soft("Leadership", {
    skipName: true,
    aliases: ["Team Leadership", "Leading Teams", "Leadership Skills", "Technical Leadership"],
    // "Present insights to leadership" names an audience, not a skill.
    patterns: [/(?<!\b(?:to|with|for|the|our|company|senior|executive|and|by)\s)\bleadership\b(?!\s+team)/i],
  }),
  soft("Collaboration", { aliases: ["Collaborative", "Collaborated", "Cross-functional", "Cross functional"] }),
  soft("Teamwork", { aliases: ["Team Player", "Team-Oriented", "Team Oriented"] }),
  soft("Problem Solving", { aliases: ["Problem-Solving", "Problem Solver", "Solve Complex Problems"] }),
  soft("Critical Thinking"),
  soft("Analytical Skills", { aliases: ["Analytical Thinking", "Analytical Mindset", "Strong Analytical"] }),
  soft("Time Management", { aliases: ["Prioritization", "Multiple Priorities", "Meet Deadlines", "Deadline-Driven"] }),
  soft("Attention to Detail", { aliases: ["Detail-Oriented", "Detail Oriented", "Meticulous"] }),
  soft("Adaptability", { aliases: ["Adaptable"] }),
  soft("Mentoring", { aliases: ["Mentorship", "Mentored", "Mentor", "Coaching", "Coached"] }),
  soft("Presentation Skills", { aliases: ["Public Speaking", "Presentations", "Presenting"] }),
  soft("Interpersonal Skills", { aliases: ["Interpersonal"] }),
  soft("Decision Making", { aliases: ["Decision-Making"] }),
  soft("Conflict Resolution"),
  soft("Self-Motivated", { aliases: ["Self-Starter", "Self Starter", "Proactive"] }),
  soft("Ownership", { aliases: ["Sense of Ownership", "Take Ownership", "Took Ownership"] }),
];

export const SKILL_BY_NAME = new Map(SKILLS.map((skill) => [skill.name, skill]));

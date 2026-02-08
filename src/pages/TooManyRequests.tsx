import { ErrorPage } from "@/components/ErrorPage";

const TooManyRequests = () => <ErrorPage statusCode="429" />;
export default TooManyRequests;

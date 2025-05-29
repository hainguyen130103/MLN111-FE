import { LoadingOutlined } from "@ant-design/icons";
import {
  Card,
  Input,
  Spin,
  Avatar,
  Typography,
  Tag,
  Space,
  Divider,
  Row,
  Col,
  Layout,
  message as antdMessage, // Để hiển thị thông báo lỗi
} from "antd";
import { marked } from "marked";
import { useEffect, useRef, useState } from "react";
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
  type Content, // Type cho lịch sử chat
  type GenerateContentRequest, // Type cho request
  type Part, // Type cho các phần của content
} from "@google/generative-ai";

const { TextArea } = Input;
const { Title, Paragraph } = Typography;

// Lấy API Key từ biến môi trường (Vite)
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Định nghĩa vai trò và nhiệm vụ của "Cú mê Triết"
const CUMEPHIET_SYSTEM_INSTRUCTION = `Vai trò: Bạn là một một trợ lý ảo tên là 'Cú mê Triết', có hứng thú vớivới Triết học Mác - Lênin uyên thâm, một nhà tư tưởng với sự am hiểu sâu sắc, toàn diện và thấm nhuần các nguyên lý cơ bản, logic biện chứng, chủ nghĩa duy vật lịch sử, chủ nghĩa duy vật biện chứng, cùng những tư tưởng kinh tế - chính trị cốt lõi của Karl Marx, Friedrich Engels và Vladimir Ilyich Lenin. Sứ mệnh của bạn là soi đường, dẫn dắt người học tiếp cận kho tàng tri thức này một cách hệ thống, khoa học, dễ hiểu và truyền cảm hứng.

Nhiệm vụ cốt lõi:

Khi người dùng đặt câu hỏi hoặc đưa ra một chủ đề liên quan đến Triết học Mác - Lênin, bạn cần thực hiện các bước sau một cách tuần tự và thấu đáo:

1. Định vị vấn đề:
 - Xác định chính xác vấn đề, khái niệm, quy luật hoặc nguyên lý mà người dùng đang đề cập thuộc bộ phận nào trong hệ thống Triết học Mác - Lênin.
 - Phân tích bối cảnh ra đời và ý nghĩa lịch sử của vấn đề đó trong sự phát triển của tư tưởng Mác - Lênin.

2. Trình bày lý luận hệ thống và khoa học:
 - Diễn giải nội dung lý luận cốt lõi một cách rõ ràng, mạch lạc, logic chặt chẽ, sử dụng thuật ngữ triết học chuẩn xác.
 - Phân tích các khía cạnh, yếu tố cấu thành, mối liên hệ nội tại và các hình thức biểu hiện của vấn đề.
 - Làm rõ các cặp phạm trù cơ bản và các quy luật cơ bản của phép biện chứng duy vật.

3. Phân tích ý nghĩa và giá trị:
 - Ý nghĩa lý luận: Làm rõ vai trò phương pháp luận của vấn đề đối với nhận thức khoa học và hoạt động thực tiễn.
 - Ý nghĩa thực tiễn: Liên hệ sâu sắc với thực tiễn cách mạng thế giới và đặc biệt là cách mạng Việt Nam.

4. Minh họa bằng ví dụ sinh động và gần gũi:
 - Sử dụng các ví dụ cụ thể từ lịch sử, đời sống xã hội, khoa học tự nhiên, khoa học xã hội để làm sáng tỏ các khái niệm trừu tượng.

5. So sánh và làm nổi bật:
 - Khi thích hợp, thực hiện so sánh, đối chiếu với các hệ thống triết học khác để làm nổi bật tính khoa học, cách mạng, ưu việt và giá trị thời đại của Triết học Mác - Lênin.

6. Cung cấp nguồn tài liệu và trích dẫn kinh điển:
 - Giới thiệu các tác phẩm kinh điển của C. Mác, Ph. Ăngghen, V. I. Lênin liên quan trực tiếp đến vấn đề đang thảo luận.
 - Trích dẫn chính xác các luận điểm quan trọng từ các tác phẩm này để tăng tính thuyết phục.

Phong cách và giọng điệu:
- Uyên bác và tự tin, rõ ràng và logic, khoa học và chính xác, gần gũi và dễ hiểu, truyền cảm hứng, khách quan và biện chứng.

Mục tiêu cuối cùng:
- Giúp người học không chỉ hiểu đúng và sâu sắc bản chất khoa học và cách mạng của Triết học Mác - Lênin, mà còn biết cách vận dụng sáng tạo những tri thức đó vào nhận thức và cải tạo thực tiễn, góp phần vào sự nghiệp xây dựng và bảo vệ Tổ quốc Việt Nam xã hội chủ nghĩa.`;

// System instruction cho việc tạo gợi ý
const SUGGESTION_SYSTEM_INSTRUCTION = `Dựa trên nội dung cuộc trò chuyện trước đó (đặc biệt là câu trả lời cuối cùng của Model), hãy tạo ra các câu hỏi gợi ý tiếp theo cho người dùng. Trả về kết quả dưới dạng một mảng JSON hợp lệ, mỗi phần tử là một object có dạng {title: string, question: string}. Tạo tối đa 3 câu hỏi gợi ý. Các câu hỏi nên tự nhiên, khuyến khích người dùng khám phá sâu hơn về chủ đề hoặc các khía cạnh liên quan. Sử dụng ngôi "bạn" khi đặt câu hỏi cho người dùng. Attribute "title" nên ngắn gọn, tóm tắt ý chính của câu hỏi. CHỈ TRẢ VỀ MẢNG JSON, KHÔNG BAO GỒM CÁC KÝ TỰ Markdown BAO QUANH (ví dụ: không dùng \`\`\`json ... \`\`\`).`;

type MessageItemProps = {
  content: string;
  sender: "me" | "model" | "system"; // Thêm "system" nếu cần, nhưng thường ẩn
  timestamp?: number; // Để dễ dàng xác định tin nhắn cuối cùng
};

type SuggestionItemProps = {
  title: string;
  question: string;
};

export default function Assistant() {
  const [messages, setMessages] = useState<MessageItemProps[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestionItemProps[]>([
    {
      title: "Nguyên lý Triết học Mác - Lênin?",
      question:
        "Cú Mê Triết ơi, bạn có thể khai sáng về các nguyên lý cơ bản của Triết học Mác - Lênin là gì không?",
    },
    {
      title: "Chủ nghĩa duy vật biện chứng",
      question:
        "Theo Cú Mê Triết, chủ nghĩa duy vật biện chứng là gì và các quy luật cơ bản của nó ra sao?",
    },
    {
      title: "Học thuyết hình thái kinh tế - xã hội",
      question:
        "Học thuyết về hình thái kinh tế - xã hội của Mác có nội dung chính là gì và ý nghĩa của nó như thế nào, Cú Mê Triết nhỉ?",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const genAIInstanceRef = useRef<GoogleGenerativeAI | null>(null);
  const generativeModelRef = useRef<any>(null); // Lưu trữ model đã khởi tạo

  // Khởi tạo GoogleGenerativeAI và model
  useEffect(() => {
    if (!GEMINI_API_KEY) {
      antdMessage.error(
        "VITE_GEMINI_API_KEY chưa được thiết lập trong file .env!"
      );
      console.error("VITE_GEMINI_API_KEY is not set in .env file");
      setIsLoading(false);
      return;
    }
    genAIInstanceRef.current = new GoogleGenerativeAI(GEMINI_API_KEY);
    generativeModelRef.current = genAIInstanceRef.current.getGenerativeModel({
      model: "gemini-1.5-flash-latest", // Bạn có thể thay đổi model nếu cần
      systemInstruction: CUMEPHIET_SYSTEM_INSTRUCTION, // System instruction chính
      safetySettings: [
        // Cấu hình an toàn cơ bản
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    });
  }, []);

  // Cuộn xuống tin nhắn cuối cùng
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getSuggestionsFromModel = async (
    chatHistory: Content[]
  ): Promise<SuggestionItemProps[]> => {
    if (!generativeModelRef.current) return [];
    try {
      // Tạo một yêu cầu mới để lấy gợi ý
      const request: GenerateContentRequest = {
        // Kết hợp lịch sử chat hiện tại và một yêu cầu tạo gợi ý mới
        contents: [
          ...chatHistory,
          {
            role: "user",
            parts: [
              {
                text: "Dựa trên cuộc trò chuyện này, hãy tạo bốn câu hỏi gợi ý.",
              },
            ],
          },
        ],
        // Sử dụng system instruction riêng cho việc tạo gợi ý
        systemInstruction: SUGGESTION_SYSTEM_INSTRUCTION,
      };

      const result = await generativeModelRef.current.generateContent(request);
      const response = result.response;
      const suggestionsText = response.text();

      if (suggestionsText) {
        // Cố gắng parse JSON, nếu lỗi thì trả về mảng rỗng
        try {
          const parsedSuggestions = JSON.parse(suggestionsText);
          if (Array.isArray(parsedSuggestions)) {
            return parsedSuggestions.slice(0, 3); // Giới hạn 3 gợi ý
          }
        } catch (e) {
          console.warn(
            "Không thể parse JSON từ gợi ý của model:",
            suggestionsText,
            e
          );
        }
      }
    } catch (error) {
      console.error("Lỗi khi tạo gợi ý từ model:", error);
    }
    return []; // Trả về mảng rỗng nếu có lỗi hoặc không có gợi ý
  };

  const handleSend = async (messageContent: string) => {
    if (!messageContent.trim() || !generativeModelRef.current) return;

    const userMessage: MessageItemProps = {
      content: messageContent,
      sender: "me",
      timestamp: Date.now(),
    };
    // Thêm tin nhắn người dùng vào state
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setIsLoading(true);

    // Chuẩn bị tin nhắn chờ của model để cập nhật từng phần (streaming)
    const modelResponseMessage: MessageItemProps = {
      content: "",
      sender: "model",
      timestamp: Date.now() + 1, // Đảm bảo nó là tin nhắn mới nhất
    };
    setMessages((prevMessages) => [...prevMessages, modelResponseMessage]);

    // Xây dựng lịch sử chat cho API từ state `messages`
    // Loại trừ tin nhắn chờ cuối cùng của model khỏi lịch sử gửi đi
    const historyForAPI: Content[] = messages.map((msg) => ({
      role: msg.sender === "me" ? "user" : "model",
      parts: [{ text: msg.content } as Part], // Ép kiểu Part
    }));

    // Thêm tin nhắn hiện tại của người dùng vào lịch sử sẽ gửi
    const currentChatContents: Content[] = [
      ...historyForAPI,
      { role: "user", parts: [{ text: messageContent } as Part] },
    ];

    try {
      const result = await generativeModelRef.current.generateContentStream({
        contents: currentChatContents,
      });

      let currentModelText = "";
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        currentModelText += chunkText;
        // Cập nhật tin nhắn cuối cùng (của model) trong state
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.timestamp === modelResponseMessage.timestamp
              ? { ...msg, content: currentModelText }
              : msg
          )
        );
      }

      // Sau khi nhận đủ câu trả lời, cập nhật lại messages lần cuối để đảm bảo content là chính xác
      // và sau đó lấy gợi ý
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.timestamp === modelResponseMessage.timestamp
            ? { ...msg, content: currentModelText }
            : msg
        )
      );

      // Lấy gợi ý mới từ model dựa trên lịch sử chat đã cập nhật
      const finalChatHistory: Content[] = [
        ...currentChatContents,
        { role: "model", parts: [{ text: currentModelText }] },
      ];
      const newSuggestions = await getSuggestionsFromModel(finalChatHistory);
      if (newSuggestions.length > 0) {
        setSuggestions(newSuggestions);
      }
    } catch (error: any) {
      console.error("Lỗi khi gửi tin nhắn đến Gemini:", error);
      let errorMessage =
        "Xin lỗi, đã có lỗi xảy ra khi kết nối với Cú mê Triết.";
      if (error.message) {
        errorMessage += ` Chi tiết: ${error.message}`;
      }
      antdMessage.error(errorMessage);
      // Cập nhật tin nhắn của model với thông báo lỗi
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.timestamp === modelResponseMessage.timestamp
            ? { ...msg, content: errorMessage }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout className="p-4 mt-20 bg-white rounded-xl shadow-md max-w-[1200px] mx-auto h-[calc(100vh-40px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center mb-4 shrink-0">
        <Avatar src="./public/Avatar.png" alt="Cú Mê Triết" size={64} />
        <div className="ml-4">
          <Title level={3} className="mb-0">
            Trợ lí Cú mê Triết
          </Title>
          <Paragraph className="text-base mb-0">
            Chào bạn, mình là Cú mê Triết - bạn đồng hành AI giúp bạn giải đáp
            thắc mắc về Triết học Mác - Lênin. Hãy hỏi mình nhé!
          </Paragraph>
        </div>
      </div>

      {/* Message area */}
      <div className="flex-grow overflow-y-auto pb-4 mb-4">
        {messages.map((msg, idx) => (
          <MessageItemUI
            key={`${msg.sender}-${msg.timestamp}-${idx}`}
            data={msg}
          />
        ))}

        {isLoading &&
          messages[messages.length - 1]?.sender === "model" &&
          messages[messages.length - 1]?.content === "" && (
            <Row justify="center" align="middle" className="mt-2">
              <Spin
                indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />}
                tip="Cú Mê Triết đang suy ngẫm..."
              />
            </Row>
          )}

        {!isLoading && messages.length > 0 && (
          <>
            <Divider>Gợi ý câu hỏi</Divider>
            <Space wrap>
              {suggestions.map((suggestion, idx) => (
                <Tag
                  key={`${suggestion.title}-${idx}`}
                  color="blue"
                  className="cursor-pointer text-sm px-3 py-2 mb-2 hover:bg-blue-500 hover:text-white transition"
                  onClick={() => handleSend(suggestion.question)}
                >
                  {suggestion.title}
                </Tag>
              ))}
            </Space>
          </>
        )}

        {!isLoading && messages.length === 0 && (
          <div>
            <Divider>Bạn có thể hỏi</Divider>
            <Space wrap>
              {suggestions.map((suggestion, idx) => (
                <Tag
                  key={`initial-${suggestion.title}-${idx}`}
                  color="geekblue"
                  className="cursor-pointer text-sm px-3 py-2 mb-2 hover:bg-blue-500 hover:text-white transition"
                  onClick={() => handleSend(suggestion.question)}
                >
                  {suggestion.title}
                </Tag>
              ))}
            </Space>
          </div>
        )}

        <div ref={messageEndRef} />
      </div>

      {/* Text input */}
      <TextArea
        rows={3}
        className="shrink-0 border border-zinc-300 rounded-md"
        placeholder="Nhập câu hỏi của bạn và nhấn Enter..."
        onPressEnter={(e) => {
          if (!isLoading && !e.shiftKey && e.currentTarget.value.trim()) {
            e.preventDefault();
            handleSend(e.currentTarget.value);
            e.currentTarget.value = "";
          }
        }}
        disabled={isLoading}
      />
    </Layout>
  );
}

// Component hiển thị tin nhắn (giữ nguyên hoặc tùy chỉnh)
const MessageItemUI = ({ data }: { data: MessageItemProps }) => {
  const isUser = data.sender === "me";
  // Sử dụng marked để render Markdown, đảm bảo an toàn nếu content từ API
  const htmlContent = marked(data.content || "", { breaks: true, gfm: true });

  return (
    <Row
      justify={isUser ? "end" : "start"}
      style={{ marginBottom: 12, display: "flex" }}
    >
      {!isUser && (
        <Avatar
          src="/public/Avatar.png" // Avatar cho Cú Mê Triết
          size="default"
          style={{ marginRight: 8, alignSelf: "flex-start" }}
        />
      )}
      <Col
        xs={20}
        md={16}
        style={{
          order: isUser ? 1 : 0,
          display: "flex", // Để căn chỉnh nội dung
          justifyContent: isUser ? "flex-end" : "flex-start", // Căn giữa cho tin nhắn của model
          alignItems: "center", // Căn giữa theo chiều dọc
        }}
      >
        <Card
          style={{
            background: isUser ? "#1677ff" : "#f0f0f0",
            color: isUser ? "white" : "black",
            borderRadius: isUser ? "12px 12px 0 12px" : "12px 12px 12px 0",
            height: "auto", // Để card tự động điều chỉnh chiều cao
            display: "inline-block", // Để card vừa với nội dung
          }}
          bodyStyle={{ padding: "10px 16px" }}
        >
          <div
            dangerouslySetInnerHTML={{ __html: htmlContent }}
            style={{ wordBreak: "break-word" }}
          />
        </Card>
      </Col>
    </Row>
  );
};

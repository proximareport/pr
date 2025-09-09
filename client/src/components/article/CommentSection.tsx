import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { RoleBadges } from "@/components/ui/role-badge";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { ArrowUpIcon, ArrowDownIcon, ReplyIcon, ZapIcon, CrownIcon } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useSubscriptionAccess } from "@/hooks/useSubscriptionAccess";

interface Comment {
  id: number;
  content: string;
  authorId: number;
  author: {
    id: number;
    username: string;
    profilePicture?: string;
    membershipTier: string;
    role?: string;
  };
  createdAt: string;
  updatedAt: string;
  upvotes: number;
  downvotes: number;
  replies?: Comment[];
  parentId?: number | null;
  isBoosted?: boolean;
  boostedBy?: number[];
}

interface CommentSectionProps {
  articleId: string;
  comments: Comment[];
  refetchComments: () => void;
}

function CommentSection({ articleId, comments = [], refetchComments }: CommentSectionProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { canAccessFeature } = useSubscriptionAccess();
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [userVotes, setUserVotes] = useState<Record<number, "up" | "down" | null>>({});
  const [loadingVotes, setLoadingVotes] = useState<Record<number, boolean>>({});
  const [deletingComment, setDeletingComment] = useState<number | null>(null);

  // Ensure comments is always an array
  const safeComments = Array.isArray(comments) ? comments : [];
  
  // Sort comments by date
  const sortedComments = [...safeComments].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Delete a comment
  const handleDeleteComment = async (commentId: number) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "You must be logged in to delete comments.",
        variant: "destructive",
      });
      return;
    }

    setDeletingComment(commentId);
    try {
      await apiRequest("DELETE", `/api/comments/${commentId}`);
      refetchComments();
      toast({
        title: "Comment Deleted",
        description: "Your comment has been deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete comment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeletingComment(null);
    }
  };

  // Submit a new comment
  const handleSubmitComment = async () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "You must be logged in to comment.",
        variant: "destructive",
      });
      return;
    }

    if (!commentText.trim()) {
      toast({
        title: "Empty Comment",
        description: "Comment cannot be empty.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await apiRequest("POST", "/api/comments", {
        content: commentText,
        ghostPostId: articleId,
        parentId: null,
      });
      setCommentText("");
      refetchComments();
      toast({
        title: "Comment Posted",
        description: "Your comment has been posted successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to post comment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit a reply to a comment
  const handleSubmitReply = async (parentId: number) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "You must be logged in to reply.",
        variant: "destructive",
      });
      return;
    }

    if (!replyText.trim()) {
      toast({
        title: "Empty Reply",
        description: "Reply cannot be empty.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await apiRequest("POST", "/api/comments", {
        content: replyText,
        ghostPostId: articleId,
        parentId,
      });
      setReplyText("");
      setReplyingTo(null);
      refetchComments();
      toast({
        title: "Reply Posted",
        description: "Your reply has been posted successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to post reply. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Vote on a comment
  const handleVote = async (commentId: number, voteType: "up" | "down") => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "You must be logged in to vote.",
        variant: "destructive",
      });
      return;
    }

    setLoadingVotes((prev) => ({ ...prev, [commentId]: true }));
    try {
      // If the user is clicking the same vote type they already selected, remove the vote
      if (userVotes[commentId] === voteType) {
        await apiRequest("DELETE", `/api/comments/${commentId}/vote`, {});
        setUserVotes((prev) => ({ ...prev, [commentId]: null }));
      } else {
        // Otherwise, add or change the vote
        await apiRequest("POST", `/api/comments/${commentId}/vote`, { voteType });
        setUserVotes((prev) => ({ ...prev, [commentId]: voteType }));
      }
      refetchComments();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to register vote. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingVotes((prev) => ({ ...prev, [commentId]: false }));
    }
  };

  // Boost a comment (tier3 users only)
  const handleBoost = async (commentId: number) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "You must be logged in to boost comments.",
        variant: "destructive",
      });
      return;
    }

    if (!canAccessFeature('comment_boosting')) {
      toast({
        title: "Premium Feature",
        description: "Comment boosting requires Enterprise subscription.",
        variant: "destructive",
      });
      return;
    }

    setLoadingVotes((prev) => ({ ...prev, [commentId]: true }));
    try {
      await apiRequest("POST", `/api/comments/${commentId}/boost`, {});
      toast({
        title: "Comment Boosted!",
        description: "This comment has been boosted and will appear higher in the list.",
      });
      refetchComments();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to boost comment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingVotes((prev) => ({ ...prev, [commentId]: false }));
    }
  };

  // Render a single comment with its replies
  const renderComment = (comment: Comment, depth = 0) => {
    const isPro = comment.author.membershipTier === "pro";
    const isSupporter = comment.author.membershipTier === "supporter";
    const isAdmin = comment.author.role === "admin";
    const isStaff = comment.author.role === "admin" || comment.author.role === "editor" || comment.author.role === "author";
    const maxDepth = 5; // Max nesting level
    const isMaxDepth = depth >= maxDepth;

    return (
      <div key={comment.id} className="mb-4">
        {/* Comment */}
        <div
          className={`${
            comment.isBoosted
              ? "bg-yellow-900/10 border border-yellow-700/30 ring-2 ring-yellow-500/20"
              : isAdmin
              ? "bg-red-900/10 border border-red-700/30"
              : isPro
              ? "bg-purple-900/10 border border-purple-700/30"
              : isSupporter
              ? "bg-purple-900/5 border border-purple-700/20"
              : isStaff
              ? "bg-blue-900/5 border border-blue-700/20"
              : "bg-[#14141E] border border-white/10"
          } rounded-lg p-4`}
        >
          <div className="flex items-start">
            <div className="mr-3">
              <Link to={`/profile/${comment.author.username}`}>
                <div
                  className={`w-10 h-10 rounded-full overflow-hidden cursor-pointer hover:scale-105 transition-transform ${
                    isAdmin 
                      ? "border-2 border-red-500" 
                      : isPro || isSupporter 
                      ? "border-2 border-purple-500 membership-badge" 
                      : isStaff
                      ? "border-2 border-blue-500"
                      : "border border-white/20"
                  }`}
                >
                  <Avatar>
                    <AvatarImage src={comment.author.profilePicture} alt={comment.author.username} />
                    <AvatarFallback className="bg-purple-900 text-white">
                      {comment.author.username.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </Link>
            </div>
            <div className="flex-1">
              <div className="flex items-center mb-1 gap-2">
                <Link 
                  to={`/profile/${comment.author.username}`}
                  className="font-medium text-white hover:text-purple-400 transition-colors cursor-pointer hover:underline"
                >
                  {comment.author.username}
                </Link>
                <RoleBadges 
                  role={comment.author.role} 
                  membershipTier={comment.author.membershipTier}
                  size="sm"
                  showAll={true}
                />
                {comment.isBoosted && (
                  <Badge variant="outline" className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 text-xs">
                    <ZapIcon className="h-3 w-3 mr-1" />
                    Boosted
                  </Badge>
                )}
                {comment.author.membershipTier === 'tier3' && (
                  <Badge variant="outline" className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs">
                    <CrownIcon className="h-3 w-3 mr-1" />
                    Top Fan
                  </Badge>
                )}
              </div>
              <p className="text-white/90 text-sm mb-2">{comment.content}</p>
              <div className="flex items-center text-sm text-white/60">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-white/60 hover:text-purple-500"
                  onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                  disabled={isMaxDepth}
                >
                  <ReplyIcon className="h-4 w-4 mr-1" /> Reply
                </Button>
                
                {/* Delete button - only show for comment author or admins */}
                {(user?.id === comment.authorId || user?.role === 'admin') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-white/60 hover:text-red-500"
                    onClick={() => handleDeleteComment(comment.id)}
                    disabled={deletingComment === comment.id}
                  >
                    {deletingComment === comment.id ? (
                      <div className="h-4 w-4 mr-1 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
                    ) : (
                      <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                    {deletingComment === comment.id ? "Deleting..." : "Delete"}
                  </Button>
                )}
                <div className="flex items-center mx-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-6 px-1 ${
                      userVotes[comment.id] === "up" ? "text-purple-500" : "text-white/60"
                    } hover:text-purple-500`}
                    onClick={() => handleVote(comment.id, "up")}
                    disabled={loadingVotes[comment.id]}
                  >
                    <ArrowUpIcon className="h-4 w-4" />
                  </Button>
                  <span className="mx-2">{comment.upvotes - comment.downvotes}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-6 px-1 ${
                      userVotes[comment.id] === "down" ? "text-purple-500" : "text-white/60"
                    } hover:text-purple-500`}
                    onClick={() => handleVote(comment.id, "down")}
                    disabled={loadingVotes[comment.id]}
                  >
                    <ArrowDownIcon className="h-4 w-4" />
                  </Button>
                </div>
                {/* Boost button for tier3 users */}
                {canAccessFeature('comment_boosting') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-6 px-2 ${
                      comment.boostedBy?.includes(user?.id || 0) ? "text-yellow-500" : "text-white/60"
                    } hover:text-yellow-500`}
                    onClick={() => handleBoost(comment.id)}
                    disabled={loadingVotes[comment.id]}
                  >
                    <ZapIcon className="h-4 w-4 mr-1" />
                    Boost
                  </Button>
                )}
                <span>{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Reply form */}
        {replyingTo === comment.id && !isMaxDepth && (
          <div className="ml-12 mt-3 mb-4">
            <Textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write a reply..."
              className="bg-[#14141E] border border-white/20 rounded-lg p-3 text-white placeholder-white/40 focus:border-purple-500 focus:outline-none mb-2"
              rows={2}
            />
            <div className="flex space-x-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setReplyingTo(null);
                  setReplyText("");
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-purple-800 hover:bg-purple-700"
                onClick={() => handleSubmitReply(comment.id)}
                disabled={isSubmitting || !replyText.trim()}
              >
                Post Reply
              </Button>
            </div>
          </div>
        )}

        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && depth < maxDepth && (
          <div className="ml-12 mt-3">
            {comment.replies.map((reply) => renderComment(reply, depth + 1))}
          </div>
        )}

        {/* Max depth reached notification */}
        {comment.replies && comment.replies.length > 0 && depth >= maxDepth && (
          <div className="ml-12 mt-3 p-3 bg-[#14141E] rounded-lg text-white/60 text-sm border border-white/10">
            <Link href={`/comment/${comment.id}`} className="text-purple-500 hover:underline">
              View more replies
            </Link>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Comment form */}
      <div className="bg-[#14141E] rounded-lg border border-white/10 p-4">
        <Textarea
          placeholder="Write a comment..."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          className="min-h-[100px] bg-[#1A1A24] border-white/10 text-white"
        />
        <div className="mt-4 flex justify-end">
          <Button
            onClick={handleSubmitComment}
            disabled={isSubmitting || !commentText.trim()}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {isSubmitting ? "Posting..." : "Post Comment"}
          </Button>
        </div>
      </div>

      {/* Comments list */}
      <div>
        {sortedComments.length > 0 ? (
          sortedComments.map((comment) => renderComment(comment))
        ) : (
          <div className="p-6 bg-[#14141E] rounded-lg border border-white/10 text-center">
            <p className="text-white/60">No comments yet. Be the first to comment!</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default CommentSection;

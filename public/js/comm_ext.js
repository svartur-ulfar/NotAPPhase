$(function(){
    // Always show last 3 comments:
    $( ".comment-box" ).each(function( index ) {
        $(this).children(".user-comment-box").slice(-2).show();
    });

    $(".see-more").click(function(e){ // click event for load more
        e.preventDefault();
        var link = $(this);

        if (link.hasClass('showing-more')) {
            link.siblings(".user-comment-box.extended").hide(1, function() {
                link.text('Show more comments..');
                link.removeClass('showing-more');
            });
            link.siblings(".user-comment-box.extended").removeClass('extended');
        } else {
            link.siblings(".user-comment-box:hidden").addClass('extended')
            link.siblings(".user-comment-box:hidden").show(1, function() {
                link.text('Show less comments..');
                link.addClass('showing-more');
            });
        }
    });
});
//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:pahamin_api/src/model/push_subscribe_input_keys.dart';
import 'package:json_annotation/json_annotation.dart';

part 'push_subscribe_input.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class PushSubscribeInput {
  /// Returns a new [PushSubscribeInput] instance.
  PushSubscribeInput({

     this.endpoint,

     this.keys,
  });

  @JsonKey(
    
    name: r'endpoint',
    required: false,
    includeIfNull: false,
  )


  final String? endpoint;



  @JsonKey(
    
    name: r'keys',
    required: false,
    includeIfNull: false,
  )


  final PushSubscribeInputKeys? keys;





    @override
    bool operator ==(Object other) => identical(this, other) || other is PushSubscribeInput &&
      other.endpoint == endpoint &&
      other.keys == keys;

    @override
    int get hashCode =>
        endpoint.hashCode +
        keys.hashCode;

  factory PushSubscribeInput.fromJson(Map<String, dynamic> json) => _$PushSubscribeInputFromJson(json);

  Map<String, dynamic> toJson() => _$PushSubscribeInputToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

